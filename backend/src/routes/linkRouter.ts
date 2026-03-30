import crypto from 'crypto';
import { Router } from "express";
import mongoose from "mongoose";
import { Link } from "../db/model";
import { authMiddleware } from "../middleware/auth";

export const linkRouter = Router()

const isValidUrl = (value: string): boolean => {
	try {
		new URL(value);
		return true;
	} catch {
		return false;
	}
};

const getRandomCode = () => {
	const random = Math.floor(Math.random() * 999999) + '';
	const md5crypto = crypto.createHash('md5').update(random).digest("hex");
	return md5crypto.substring(0, 7);
}

const normalizeSlug = (value: string) => value.trim().toLowerCase();

const isValidSlug = (value: string) => /^[a-z0-9-]+$/.test(value);

const isMongoUniqueSlugError = (error: unknown): boolean => {
	if (!error || typeof error !== "object") {
		return false;
	}

	const mongooseError = error as { code?: number; keyPattern?: Record<string, number> };
	return mongooseError.code === 11000 && !!mongooseError.keyPattern?.slug;
};

const generateUniqueSlug = async (): Promise<string> => {
	let slug = getRandomCode();
	let existing = await Link.findOne({ slug }).select("_id").lean();

	while (existing) {
		slug = getRandomCode();
		existing = await Link.findOne({ slug }).select("_id").lean();
	}

	return slug;
};

const toLinkResponse = (link: {
	_id: mongoose.Types.ObjectId;
	title: string;
	slug: string;
	url: string;
	createdAt?: Date;
	updatedAt?: Date;
}) => ({
	id: link._id.toString(),
	title: link.title,
	slug: link.slug,
	url: link.url,
	createdAt: link.createdAt,
	updatedAt: link.updatedAt,
});

linkRouter.get('/resolve/:slug', async (req, res) => {
	try {
		const rawSlug = req.params.slug;
		if (!rawSlug) {
			res.status(400).json({ message: "slug is required" });
			return;
		}

		const slug = normalizeSlug(rawSlug);
		const link = await Link.findOne({ slug }).select("_id slug url").lean();

		if (!link) {
			res.status(404).json({ message: "Link not found" });
			return;
		}

		res.json({ slug: link.slug, url: link.url });
	} catch {
		res.status(500).json({ message: "Failed to resolve link" });
	}
})

linkRouter.get('/', authMiddleware, async (req, res) => {
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
			.select("_id title slug url createdAt updatedAt")
			.lean();

		res.json({ links: links.map(toLinkResponse) });
	} catch {
		res.status(500).json({ message: "Failed to fetch links" });
	}
})

linkRouter.post('/create', authMiddleware, async (req, res) => {
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

		const { title, url, slug } = req.body as { title?: string; url?: string; slug?: string };

		if (!title || !url) {
			res.status(400).json({ message: "title and url are required" });
			return;
		}

		if (!isValidUrl(url)) {
			res.status(400).json({ message: "Invalid url" });
			return;
		}
		let finalSlug: string;
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
})

linkRouter.post('/update', authMiddleware, async (req, res) => {
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

		const { slug, title, url } = req.body as { slug?: string; title?: string; url?: string };

		if (!slug) {
			res.status(400).json({ message: "slug is required" });
			return;
		}

		const normalizedSlug = normalizeSlug(slug);
		if (!isValidSlug(normalizedSlug)) {
			res.status(400).json({ message: "Invalid slug" });
			return;
		}

		const data: { title?: string; url?: string } = {};
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

		const link = await Link.findOneAndUpdate(
			{ slug: normalizedSlug, user: userId },
			{ $set: data },
			{ new: true }
		).lean();

		if (!link) {
			res.status(404).json({ message: "Link not found" });
			return;
		}

		res.json({ message: "Link updated", link: toLinkResponse(link) });
	} catch {
		res.status(500).json({ message: "Failed to update link" });
	}
})

linkRouter.delete('/', authMiddleware, async (req, res) => {
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

		const slug = ((req.body as { slug?: string })?.slug || (req.query.slug as string | undefined));
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
})