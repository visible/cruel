import { DocsLayout } from "fumadocs-ui/layouts/docs"
import type { ReactNode } from "react"
import { source } from "@/lib/source"
import "./docs.css"

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<div className="docs-panel h-dvh overflow-hidden bg-[#100E0E]">
			<div className="relative z-0 h-full overflow-hidden">
				<DocsLayout
					tree={source.getPageTree()}
					nav={{
						title: "cruel",
						url: "/",
					}}
					links={[
						{ text: "story", url: "/story" },
						{ text: "github", url: "https://github.com/visible/cruel" },
					]}
					themeSwitch={{ enabled: false }}
				>
					{children}
				</DocsLayout>
			</div>
		</div>
	)
}
