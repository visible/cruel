import defaultMdxComponents from "fumadocs-ui/mdx"
import { DocsBody, DocsPage } from "fumadocs-ui/page"
import type { MDXContent } from "mdx/types"
import { notFound } from "next/navigation"
import { source } from "@/lib/source"

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

	return (
		<DocsPage toc={resolved.toc}>
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
