import { readFile } from "node:fs/promises"
import { join } from "node:path"
import defaultMdxComponents from "fumadocs-ui/mdx"
import { DocsBody, DocsPage } from "fumadocs-ui/page"
import type { MDXContent } from "mdx/types"
import { notFound } from "next/navigation"
import { Anchor } from "@/components/anchor"
import { Copy } from "@/components/copy"
import { source } from "@/lib/source"

export const dynamic = "force-static"
export const dynamicParams = false
export const revalidate = false

function clean(text: string): string {
	return text.replace(/^---[\s\S]*?---\s*/m, "").trim()
}

function name(slug?: string[]): string {
	if (!slug || slug.length === 0) return "index"
	return slug.join("/")
}

async function markdown(slug?: string[]): Promise<string> {
	const file = `${name(slug)}.mdx`
	const paths = [
		join(process.cwd(), "content/docs", file),
		join(process.cwd(), "packages/web/content/docs", file),
	]

	for (const path of paths) {
		try {
			return clean(await readFile(path, "utf8"))
		} catch {}
	}

	return ""
}

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
	const params = await props.params
	const page = source.getPage(params.slug)
	if (!page) notFound()

	const data = page.data as typeof page.data & {
		body: MDXContent
		toc: { depth: number; url: string; title: string }[]
		load?: () => Promise<{ body: MDXContent; toc: { depth: number; url: string; title: string }[] }>
	}

	const resolved = data.load ? await data.load() : data
	const MDX = resolved.body
	const text = await markdown(params.slug)

	return (
		<DocsPage
			toc={resolved.toc}
			tableOfContent={{
				style: "clerk",
				footer: <Copy text={text} />,
			}}
			tableOfContentPopover={{
				style: "clerk",
			}}
		>
			<Anchor />
			<DocsBody>
				<h1>{page.data.title}</h1>
				<p className="text-fd-muted-foreground text-lg">{page.data.description}</p>
				<MDX components={{ ...defaultMdxComponents }} />
			</DocsBody>
		</DocsPage>
	)
}

export function generateStaticParams() {
	return source.generateParams()
}
