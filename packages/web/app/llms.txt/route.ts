import { readdir } from "node:fs/promises"
import { join } from "node:path"

export const runtime = "nodejs"
export const dynamic = "force-static"
export const revalidate = false

function roots(): string[] {
	return [join(process.cwd(), "content/docs"), join(process.cwd(), "packages/web/content/docs")]
}

async function pages(): Promise<string[]> {
	for (const root of roots()) {
		try {
			const list = await readdir(root)
			return list
				.filter((item) => item.endsWith(".mdx"))
				.map((item) => item.replace(/\.mdx$/, ""))
				.sort()
		} catch {}
	}

	return []
}

function url(name: string): string {
	if (name === "index") return "https://cruel.dev/docs"
	return `https://cruel.dev/docs/${name}`
}

export async function GET(): Promise<Response> {
	const list = await pages()
	const lines: string[] = [
		"project: cruel",
		"site: https://cruel.dev",
		"summary: chaos engineering for AI SDK and async APIs",
		"",
		"docs_markdown: https://cruel.dev/docs.md",
		"docs_root: https://cruel.dev/docs",
		"",
		"docs_pages:",
	]

	for (const item of list) {
		lines.push(`- ${url(item)}`)
	}

	lines.push("")

	return new Response(lines.join("\n"), {
		headers: {
			"content-type": "text/plain; charset=utf-8",
			"cache-control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
		},
	})
}
