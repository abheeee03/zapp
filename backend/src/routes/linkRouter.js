import crypto from "crypto";
import { Router } from "express";
import mongoose from "mongoose";
import { Link } from "../db/model.js";
import { authMiddleware } from "../middleware/auth.js";

export const linkRouter = Router();

const isValidUrl = (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const getRandomCode = () => {
  const random = Math.floor(Math.random() * 999999) + "";
  const md5crypto = crypto.createHash("md5").update(random).digest("hex");
  return md5crypto.substring(0, 7);
};

const normalizeSlug = (value) => value.trim().toLowerCase();

const isValidSlug = (value) => /^[a-z0-9-]+$/.test(value);

const isMongoUniqueSlugError = (error) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  return error.code === 11000 && Boolean(error.keyPattern?.slug);
};

const generateUniqueSlug = async () => {
  let slug = getRandomCode();
  let existing = await Link.findOne({ slug }).select("_id").lean();

  while (existing) {
    slug = getRandomCode();
    existing = await Link.findOne({ slug }).select("_id").lean();
  }

  return slug;
};

const toLinkResponse = (link) => ({
  id: link._id.toString(),
  title: link.title,
  slug: link.slug,
  url: link.url,
  clicks: link.clicks ?? 0,
  createdAt: link.createdAt,
  updatedAt: link.updatedAt,
});

linkRouter.get("/resolve/:slug", async (req, res) => {
  try {
    const rawSlug = req.params.slug;
    if (!rawSlug) {
      res.status(400).json({ message: "slug is required" });
      return;
    }

    const slug = normalizeSlug(rawSlug);
    const link = await Link.findOneAndUpdate(
      { slug },
      { $inc: { clicks: 1 } },
      { new: true }
    )
      .select("_id slug url")
      .lean();

    if (!link) {
      res.status(404).json({ message: "Link not found" });
      return;
    }

    res.json({ slug: link.slug, url: link.url });
  } catch {
    res.status(500).json({ message: "Failed to resolve link" });
  }
});

linkRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!mongoose.isValidObjectId(userId)) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const links = await Link.find({ user: userId })
      .sort({ createdAt: -1 })
      .select("_id title slug url clicks createdAt updatedAt")
      .lean();

    res.json({ links: links.map(toLinkResponse) });
  } catch {
    res.status(500).json({ message: "Failed to fetch links" });
  }
});

linkRouter.post("/create", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!mongoose.isValidObjectId(userId)) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const body = typeof req.body === "object" && req.body ? req.body : {};
    const { title, url, slug } = body;

    if (!title || !url) {
      res.status(400).json({ message: "title and url are required" });
      return;
    }

    if (!isValidUrl(url)) {
      res.status(400).json({ message: "Invalid url" });
      return;
    }

    let finalSlug;
    if (slug && slug.trim()) {
      finalSlug = normalizeSlug(slug);
      if (!isValidSlug(finalSlug)) {
        res.status(400).json({ message: "Invalid slug. Use lowercase letters, numbers, and hyphens only" });
        return;
      }

      const existingSlug = await Link.findOne({ slug: finalSlug }).select("_id").lean();
      if (existingSlug) {
        res.status(409).json({ message: "Slug already exists" });
        return;
      }
    } else {
      finalSlug = await generateUniqueSlug();
    }

    const link = await Link.create({
      title: title.trim(),
      slug: finalSlug,
      url: url.trim(),
      user: userId,
    });

    res.status(201).json({ message: "Link created", link: toLinkResponse(link) });
  } catch (error) {
    if (isMongoUniqueSlugError(error)) {
      res.status(409).json({ message: "Slug already exists" });
      return;
    }

    res.status(500).json({ message: "Failed to create link" });
  }
});

linkRouter.post("/update", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!mongoose.isValidObjectId(userId)) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const body = typeof req.body === "object" && req.body ? req.body : {};
    const { slug, title, url } = body;

    if (!slug) {
      res.status(400).json({ message: "slug is required" });
      return;
    }

    const normalizedSlug = normalizeSlug(slug);
    if (!isValidSlug(normalizedSlug)) {
      res.status(400).json({ message: "Invalid slug" });
      return;
    }

    const data = {};
    if (typeof title === "string" && title.trim()) {
      data.title = title.trim();
    }
    if (typeof url === "string" && url.trim()) {
      if (!isValidUrl(url)) {
        res.status(400).json({ message: "Invalid url" });
        return;
      }
      data.url = url.trim();
    }

    if (!data.title && !data.url) {
      res.status(400).json({ message: "Nothing to update" });
      return;
    }

    const link = await Link.findOneAndUpdate({ slug: normalizedSlug, user: userId }, { $set: data }, { new: true }).lean();

    if (!link) {
      res.status(404).json({ message: "Link not found" });
      return;
    }

    res.json({ message: "Link updated", link: toLinkResponse(link) });
  } catch {
    res.status(500).json({ message: "Failed to update link" });
  }
});

linkRouter.delete("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!mongoose.isValidObjectId(userId)) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const bodySlug = typeof req.body === "object" && req.body ? req.body.slug : undefined;
    const querySlug = typeof req.query?.slug === "string" ? req.query.slug : undefined;
    const slug = bodySlug || querySlug;

    if (!slug) {
      res.status(400).json({ message: "slug is required" });
      return;
    }

    const normalizedSlug = normalizeSlug(slug);
    if (!isValidSlug(normalizedSlug)) {
      res.status(400).json({ message: "Invalid slug" });
      return;
    }

    const deleted = await Link.deleteOne({ slug: normalizedSlug, user: userId });

    if (deleted.deletedCount === 0) {
      res.status(404).json({ message: "Link not found" });
      return;
    }

    res.json({ message: "Link deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete link" });
  }
});