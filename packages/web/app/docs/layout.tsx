import { DocsLayout } from "fumadocs-ui/layouts/docs"
import { source } from "@/lib/source"
import type { ReactNode } from "react"
import "./docs.css"

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<div className="h-dvh bg-[#f5f3ef] p-[var(--docs-pad)] overflow-hidden">
			<div className="docs-panel relative rounded-[var(--panel-radius)] border border-white/10 overflow-hidden h-full">
				<div className="panel-bg absolute inset-0" />
				<div className="grain absolute inset-0 pointer-events-none" />

				<div className="relative z-0 h-full overflow-hidden rounded-[var(--panel-radius)]">
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
		</div>
	)
}
