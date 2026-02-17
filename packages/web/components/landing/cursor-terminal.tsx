"use client"

import { useMemo, useState } from "react"

type tone = "input" | "plain" | "dim" | "ok" | "warn" | "err"

type line = {
	readonly tone: tone
	readonly text: string
}

type scene = {
	readonly name: string
	readonly seed: number
	readonly data: readonly line[]
}

const scenes: readonly scene[] = [
	{
		name: "1: presets",
		seed: 42,
		data: [
			{ tone: "input", text: "$ cruel presets" },
			{ tone: "plain", text: "available presets:" },
			{ tone: "dim", text: "development fail=0.01 delay=[10,100]" },
			{ tone: "dim", text: "staging fail=0.05 delay=[50,500] timeout=0.02" },
			{ tone: "dim", text: "production fail=0.10 delay=[100,1000] timeout=0.05" },
			{ tone: "dim", text: "harsh fail=0.20 delay=[500,2000] timeout=0.10" },
			{ tone: "dim", text: "nightmare fail=0.40 delay=[1000,5000] timeout=0.20" },
			{ tone: "plain", text: "" },
			{ tone: "input", text: "$ cruel preset nightmare --seed 42" },
			{ tone: "ok", text: "preset locked" },
		],
	},
	{
		name: "2: core",
		seed: 77,
		data: [
			{ tone: "plain", text: 'import { cruel } from "cruel"' },
			{ tone: "plain", text: "const api = cruel(fetch, {" },
			{ tone: "plain", text: "  fail: 0.1," },
			{ tone: "plain", text: "  delay: [120, 900]," },
			{ tone: "plain", text: "  timeout: 0.05," },
			{ tone: "plain", text: "})" },
			{ tone: "plain", text: "" },
			{ tone: "input", text: 'const res = await api("https://api.example.com")' },
			{ tone: "ok", text: "request chaos injected" },
		],
	},
	{
		name: "3: ai-sdk",
		seed: 12,
		data: [
			{ tone: "plain", text: 'import { gateway } from "@ai-sdk/gateway"' },
			{ tone: "plain", text: 'import { cruelModel } from "cruel/ai-sdk"' },
			{ tone: "plain", text: 'import { generateText } from "ai"' },
			{ tone: "plain", text: "" },
			{ tone: "plain", text: 'const model = cruelModel(gateway("openai/gpt-4o"), {' },
			{ tone: "plain", text: "  rateLimit: 0.1," },
			{ tone: "plain", text: "  slowTokens: [40, 120]," },
			{ tone: "plain", text: "})" },
			{ tone: "plain", text: "await generateText({ model, prompt })" },
		],
	},
]

function style(tone: tone): string {
	switch (tone) {
		case "input":
			return "text-white/78"
		case "dim":
			return "text-white/42"
		case "ok":
			return "text-[#8FCF84]"
		case "warn":
			return "text-[#FFC66D]"
		case "err":
			return "text-[#FF6B68]"
		default:
			return "text-white/68"
	}
}

export function CursorTerminal() {
	const [slot, setslot] = useState(1)
	const active = scenes[slot]
	const rows = useMemo(() => active.data, [active])

	return (
		<div className="group flex h-[460px] flex-col transition-all duration-300 hover:brightness-110 md:h-[580px]">
			<div className="flex items-center justify-between border-b border-white/8 bg-black/15 px-3 py-2">
				<div className="flex items-center gap-3 font-mono text-[11px] text-white/45 tabular-nums">
					<div>
						session <span className="text-white/75">{active.name}</span>
					</div>
					<div>
						seed <span className="text-white/75">{active.seed}</span>
					</div>
				</div>
				<div className="flex items-center gap-2 font-mono text-[11px] text-white/45">
					<span className="inline-flex size-1.5 rounded-full bg-[#8FCF84]" />
					stable
				</div>
			</div>

			<div className="cursor-terminal-scroll flex-1 overflow-y-auto bg-[#050505] px-4 py-3 font-mono text-[12px] leading-[1.62] tabular-nums">
				{rows.map((row, index) => (
					<div
						key={`${active.name}-${index}`}
						className={`${style(row.tone)} transition-colors duration-150`}
					>
						{row.text || "\u00A0"}
					</div>
				))}
			</div>

			<div className="border-t border-white/8 bg-black/15 px-2 py-1.5">
				<div className="cursor-terminal-scroll flex items-center gap-1 overflow-x-auto font-mono text-[11px] text-white/45">
					{scenes.map((scene, index) => {
						const current = index === slot
						return (
							<button
								key={scene.name}
								type="button"
								onClick={() => setslot(index)}
								className={`shrink-0 rounded-sm border px-2.5 py-1 transition-colors duration-150 ${
									current
										? "border-white/20 bg-white/[0.08] text-white/88"
										: "border-transparent text-white/45 hover:border-white/12 hover:text-white/72"
								}`}
								aria-label={`open ${scene.name}`}
							>
								{current ? `*${scene.name}` : scene.name}
							</button>
						)
					})}
				</div>
			</div>
		</div>
	)
}
