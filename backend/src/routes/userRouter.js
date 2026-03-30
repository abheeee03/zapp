import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Link, User } from "../db/model.js";
import { authMiddleware } from "../middleware/auth.js";

export const userRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

const toLinkResponse = (link) => ({
  id: link._id.toString(),
  title: link.title,
  slug: link.slug,
  url: link.url,
  createdAt: link.createdAt,
  updatedAt: link.updatedAt,
});

userRouter.post("/signup", async (req, res) => {
  try {
    const body = typeof req.body === "object" && req.body ? req.body : {};
    const { email, password } = body;

    if (!email || !password) {
      res.status(400).json({ message: "email and password are required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail }).select("_id").lean();
    if (existingUser) {
      res.status(409).json({ message: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: "User created",
      token,
      user: { id: user.id, email: user.email },
    });
  } catch {
    res.status(500).json({ message: "Failed to signup" });
  }
});

userRouter.post("/login", async (req, res) => {
  try {
    const body = typeof req.body === "object" && req.body ? req.body : {};
    const { email, password } = body;

    if (!email || !password) {
      res.status(400).json({ message: "email and password are required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email },
    });
  } catch {
    res.status(500).json({ message: "Failed to login" });
  }
});

userRouter.get("/", authMiddleware, async (req, res) => {
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

    const user = await User.findById(userId).select("_id email").lean();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const links = await Link.find({ user: user._id })
      .sort({ createdAt: -1 })
      .select("_id title slug url createdAt updatedAt")
      .lean();

    res.json({
      id: user._id.toString(),
      email: user.email,
      link: links.map(toLinkResponse),
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});