import crypto from 'crypto';
import { Router } from "express";
import { prisma } from "../lib/prisma";
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

const generateUniqueSlug = async (): Promise<string> => {
	let slug = getRandomCode();
	let existing = await prisma.links.findFirst({ where: { slug } });

	while (existing) {
		slug = getRandomCode();
		existing = await prisma.links.findFirst({ where: { slug } });
	}

	return slug;
};

linkRouter.get('/resolve/:slug', async (req, res) => {
	try {
		const rawSlug = req.params.slug;
		if (!rawSlug) {
			res.status(400).json({ message: "slug is required" });
			return;
		}

		const slug = normalizeSlug(rawSlug);
		const link = await prisma.links.findFirst({ where: { slug } });

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

		const rawLinks = await prisma.links.findMany({
			where: { userID: userId },
			orderBy: { id: "desc" },
		});

		const links = await Promise.all(
			rawLinks.map(async (link) => {
				if (link.slug) {
					return link;
				}

				const generatedSlug = await generateUniqueSlug();
				return prisma.links.update({
					where: { id: link.id },
					data: { slug: generatedSlug },
				});
			})
		);

		res.json({ links });
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

			const existingSlug = await prisma.links.findFirst({ where: { slug: finalSlug } });
			if (existingSlug) {
				res.status(409).json({ message: "Slug already exists" });
				return;
			}
		} else {
			finalSlug = await generateUniqueSlug();
		}

		const link = await prisma.links.create({
			data: {
				title: title.trim(),
				slug: finalSlug,
				url: url.trim(),
				userID: userId,
			},
		});

		res.status(201).json({ message: "Link created", link });
	} catch {
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

		const { slug, title, url } = req.body as { slug?: string; title?: string; url?: string };

		if (!slug) {
			res.status(400).json({ message: "slug is required" });
			return;
		}

		const normalizedSlug = normalizeSlug(slug);

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

		const updated = await prisma.links.updateMany({
			where: { slug: normalizedSlug, userID: userId },
			data,
		});

		if (updated.count === 0) {
			res.status(404).json({ message: "Link not found" });
			return;
		}

		const link = await prisma.links.findFirst({ where: { slug: normalizedSlug, userID: userId } });
		res.json({ message: "Link updated", link });
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

		const slug = ((req.body as { slug?: string })?.slug || (req.query.slug as string | undefined));
		if (!slug) {
			res.status(400).json({ message: "slug is required" });
			return;
		}

		const normalizedSlug = normalizeSlug(slug);

		const deleted = await prisma.links.deleteMany({
			where: { slug: normalizedSlug, userID: userId },
		});

		if (deleted.count === 0) {
			res.status(404).json({ message: "Link not found" });
			return;
		}

		res.json({ message: "Link deleted" });
	} catch {
		res.status(500).json({ message: "Failed to delete link" });
	}
})