import type { MetadataRoute } from "next"
import { source } from "@/lib/source"

export default function sitemap(): MetadataRoute.Sitemap {
	const base = "https://cruel.dev"
	const time = new Date()
	const set = new Set<string>([`${base}/`, `${base}/docs`, `${base}/story`])

	for (const item of source.generateParams()) {
		const slug = item.slug?.join("/")
		set.add(slug ? `${base}/docs/${slug}` : `${base}/docs`)
	}

	return Array.from(set).map((url) => ({
		url,
		lastModified: time,
		changeFrequency: "weekly",
		priority: url === `${base}/` ? 1 : 0.8,
	}))
}
