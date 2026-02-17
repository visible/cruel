"use client"

import Link from "next/link"
import { CursorMacWindow } from "./cursor-mac-window"
import { CursorStage } from "./cursor-stage"
import { CursorTerminal } from "./cursor-terminal"

export function CursorHero() {
	return (
		<section className="relative overflow-hidden pt-32 pb-0 md:pt-44 md:pb-0">
			<div className="mx-auto max-w-[1320px] px-6">
				<div className="max-w-184">
					<h1
						className="cursor-fade-up text-5xl font-semibold tracking-tighter text-white sm:text-6xl md:text-7xl leading-[1.03]"
						style={{ animationDelay: "30ms" }}
					>
						Ship resilient AI and APIs.
					</h1>
					<p
						className="cursor-fade-up mt-6 text-lg text-[#A1A1A1] leading-relaxed"
						style={{ animationDelay: "90ms" }}
					>
						Inject realistic failures into AI SDK flows and core async APIs before launch.
					</p>
				</div>

				<div className="cursor-fade-up mt-8 flex items-center" style={{ animationDelay: "150ms" }}>
					<Link
						href="/docs"
						className="group inline-flex h-14 items-center gap-3 rounded-none border border-white/14 bg-[#151313] px-8 text-base font-medium text-white transition-colors hover:bg-[#1A1818]"
					>
						<span>Start Here</span>
						<svg
							viewBox="0 0 32 32"
							className="size-5 text-[#ede8da] transition-transform duration-500 group-hover:rotate-180"
							fill="none"
							aria-hidden="true"
						>
							<line x1="16" y1="4" x2="16" y2="28" stroke="currentColor" strokeWidth="1.5" />
							<line x1="4" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="1.5" />
							<line x1="7.5" y1="7.5" x2="24.5" y2="24.5" stroke="currentColor" strokeWidth="1.5" />
							<line x1="24.5" y1="7.5" x2="7.5" y2="24.5" stroke="currentColor" strokeWidth="1.5" />
						</svg>
					</Link>
				</div>
			</div>

			<div className="mx-auto mt-16 max-w-[1320px] px-6 md:mt-20 md:px-0">
				<div className="cursor-fade-up" style={{ animationDelay: "240ms" }}>
					<CursorStage tone="dune" square>
						<div className="mx-auto w-full max-w-[1160px]">
							<CursorMacWindow title="terminal" bar={false}>
								<CursorTerminal />
							</CursorMacWindow>
						</div>
					</CursorStage>
				</div>
			</div>
		</section>
	)
}
