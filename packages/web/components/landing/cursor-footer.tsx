import Link from "next/link"

export function CursorFooter() {
	return (
		<footer>
			<div className="mx-auto max-w-[1320px] border-t border-white/8 px-6 py-14 md:py-18">
				<div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
					<div className="flex h-full flex-col">
						<div className="text-xs font-mono uppercase tracking-widest text-white/40">Cruel</div>
						<div className="mt-3 text-sm text-white/45">
							Chaos engineering for AI SDK and async APIs.
						</div>
						<div className="mt-auto pt-6 text-sm text-white/40">© {new Date().getFullYear()} Visible</div>
					</div>

					<div>
						<div className="text-xs font-mono uppercase tracking-widest text-white/40">
							Product
						</div>
						<div className="mt-4 flex flex-col gap-2">
							<Link href="/docs" className="text-sm text-white/55 hover:text-white transition-colors">
								Docs
							</Link>
							<Link
								href="/docs/core"
								className="text-sm text-white/55 hover:text-white transition-colors"
							>
								Core API
							</Link>
							<Link
								href="/docs/aisdk"
								className="text-sm text-white/55 hover:text-white transition-colors"
							>
								AI SDK integration
							</Link>
							<Link
								href="/docs/chaos"
								className="text-sm text-white/55 hover:text-white transition-colors"
							>
								Chaos modes
							</Link>
							<Link
								href="/docs/resilience"
								className="text-sm text-white/55 hover:text-white transition-colors"
							>
								Resilience patterns
							</Link>
						</div>
					</div>

					<div>
						<div className="text-xs font-mono uppercase tracking-widest text-white/40">
							Resources
						</div>
						<div className="mt-4 flex flex-col gap-2">
							<a
								href="https://github.com/visible/cruel"
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm text-white/55 hover:text-white transition-colors"
							>
								GitHub
							</a>
							<a
								href="https://github.com/visible/cruel/releases"
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm text-white/55 hover:text-white transition-colors"
							>
								Releases
							</a>
							<a
								href="https://www.npmjs.com/package/cruel"
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm text-white/55 hover:text-white transition-colors"
							>
								NPM
							</a>
						</div>
					</div>

					<div>
						<div className="text-xs font-mono uppercase tracking-widest text-white/40">Company</div>
						<div className="mt-4 flex flex-col gap-2">
							<a
								href="https://github.com/visible"
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm text-white/55 hover:text-white transition-colors"
							>
								Visible
							</a>
							<Link
								href="/story"
								className="text-sm text-white/55 hover:text-white transition-colors"
							>
								Story
							</Link>
						</div>
					</div>
				</div>
			</div>
		</footer>
	)
}
