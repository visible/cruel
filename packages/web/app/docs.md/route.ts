import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"

export const runtime = "nodejs"
export const dynamic = "force-static"
export const revalidate = false

function roots(): string[] {
	return [join(process.cwd(), "content/docs"), join(process.cwd(), "packages/web/content/docs")]
}

async function files(): Promise<string[]> {
	for (const root of roots()) {
		try {
			const list = await readdir(root)
			const out = list.filter((item) => item.endsWith(".mdx")).sort()
			if (out.length > 0) return out.map((item) => join(root, item))
		} catch {}
	}

	return []
}

function clean(text: string): string {
	return text.replace(/^---[\s\S]*?---\s*/m, "").trim()
}

function name(path: string): string {
	const item = path.split("/").pop() ?? "doc"
	return item.replace(/\.mdx$/, "")
}

export async function GET(): Promise<Response> {
	const paths = await files()
	const chunks: string[] = ["# Cruel Docs", ""]

	for (const path of paths) {
		const raw = await readFile(path, "utf8")
		const key = name(path)
		const title = key === "index" ? "getting started" : key
		chunks.push(`## ${title}`)
		chunks.push("")
		chunks.push(clean(raw))
		chunks.push("")
	}

	return new Response(chunks.join("\n"), {
		headers: {
			"content-type": "text/markdown; charset=utf-8",
			"cache-control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
		},
	})
}
