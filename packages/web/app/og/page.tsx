export default function Page() {
	return (
		<>
			<style>{`
				html, body { margin: 0 !important; padding: 0 !important; background: #0a0a0a !important; overflow: hidden !important; }
				[data-nextjs-dialog-overlay], [data-nextjs-dialog], nextjs-portal { display: none !important; }
			`}</style>
			<main className="fixed left-0 top-0 h-[630px] w-[1200px] overflow-hidden bg-[#0a0a0a] text-white">
				<div className="absolute inset-[12px] border border-white/[0.06] pointer-events-none" />
				<div className="absolute inset-[20px] border border-white/[0.03] pointer-events-none" />

				<div className="relative z-10 h-full flex flex-col p-10">
					<div className="flex-1">
						<div className="text-[11px] uppercase tracking-[0.3em] text-white/20">
							chaos engineering
						</div>
						<h1 className="-ml-[10px] mt-5 text-[116px] leading-[0.85] tracking-[-0.06em] font-bold text-white/92">
							cruel
						</h1>
						<p className="mt-3 max-w-[560px] text-[34px] leading-[1.15] tracking-[-0.03em] text-white/52">
							chaos testing with zero mercy
						</p>
						<p className="mt-8 max-w-[540px] text-[22px] leading-[1.35] tracking-[-0.015em] text-white/38">
							inject failures, latency, and timeouts into any async function, model, provider, or
							tool before production.
						</p>
					</div>
					<div className="h-[56px] border-t border-white/[0.06] flex items-center justify-between text-[20px] tracking-[-0.02em] text-white/34">
						<div>cruel.dev</div>
						<div className="flex items-center gap-2">
							<span className="text-white/18">$</span>
							<span>bun add cruel</span>
						</div>
					</div>
				</div>
			</main>
		</>
	)
}
