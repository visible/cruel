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
						title: (
							<span className="inline-flex items-center justify-center" aria-label="Cruel">
								<svg
									viewBox="0 0 32 32"
									className="size-5 text-[#f1ecde]"
									fill="none"
									aria-hidden="true"
								>
									<line
										x1="16"
										y1="4"
										x2="16"
										y2="28"
										stroke="currentColor"
										strokeWidth="1.7"
										strokeLinecap="round"
									/>
									<line
										x1="4"
										y1="16"
										x2="28"
										y2="16"
										stroke="currentColor"
										strokeWidth="1.7"
										strokeLinecap="round"
									/>
									<line
										x1="7.5"
										y1="7.5"
										x2="24.5"
										y2="24.5"
										stroke="currentColor"
										strokeWidth="1.7"
										strokeLinecap="round"
									/>
									<line
										x1="24.5"
										y1="7.5"
										x2="7.5"
										y2="24.5"
										stroke="currentColor"
										strokeWidth="1.7"
										strokeLinecap="round"
									/>
								</svg>
							</span>
						),
						url: "/",
					}}
					links={[
						{ text: "Story", url: "/story" },
						{ text: "GitHub", url: "https://github.com/visible/cruel" },
					]}
					themeSwitch={{ enabled: false }}
				>
					{children}
				</DocsLayout>
			</div>
		</div>
	)
}
