export function CodeDemo() {
	return (
		<div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#0a0a0a] font-mono text-sm shadow-2xl">
			<div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-2">
				<div className="h-3 w-3 rounded-full bg-red-500/20" />
				<div className="h-3 w-3 rounded-full bg-yellow-500/20" />
				<div className="h-3 w-3 rounded-full bg-green-500/20" />
				<div className="ml-2 text-xs text-white/30">chaos.ts</div>
			</div>
			<div className="p-4 text-white/80">
				<div className="flex">
					<span className="mr-4 select-none text-white/20">1</span>
					<span>
						<span className="text-purple-400">import</span> {"{"} cruel {"}"}{" "}
						<span className="text-purple-400">from</span> <span className="text-green-400">"cruel"</span>
					</span>
				</div>
				<div className="flex">
					<span className="mr-4 select-none text-white/20">2</span>
					<span></span>
				</div>
				<div className="flex">
					<span className="mr-4 select-none text-white/20">3</span>
					<span>
						<span className="text-purple-400">const</span> api = cruel(fetch, {"{"}
					</span>
				</div>
				<div className="flex">
					<span className="mr-4 select-none text-white/20">4</span>
					<span className="pl-4">
						fail: <span className="text-orange-400">0.1</span>, <span className="text-white/30">{"// 10% failure rate"}</span>
					</span>
				</div>
				<div className="flex">
					<span className="mr-4 select-none text-white/20">5</span>
					<span className="pl-4">
						delay: [<span className="text-orange-400">100</span>, <span className="text-orange-400">500</span>], <span className="text-white/30">{"// 100-500ms latency"}</span>
					</span>
				</div>
				<div className="flex">
					<span className="mr-4 select-none text-white/20">6</span>
					<span className="pl-4">
						timeout: <span className="text-orange-400">0.05</span>, <span className="text-white/30">{"// 5% timeouts"}</span>
					</span>
				</div>
				<div className="flex">
					<span className="mr-4 select-none text-white/20">7</span>
					<span>{"})"}</span>
				</div>
			</div>
			<div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
		</div>
	)
}
