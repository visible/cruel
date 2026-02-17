"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { CursorMacWindow } from "./cursor-mac-window"
import { CursorStage } from "./cursor-stage"

type row = {
	readonly tone: "cmd" | "code" | "dim"
	readonly text: string
}

const presetrows: readonly row[] = [
	{ tone: "cmd", text: '$ bun add cruel ai @ai-sdk/openai' },
	{ tone: "code", text: 'import { openai } from "@ai-sdk/openai"' },
	{ tone: "code", text: 'import { generateText } from "ai"' },
	{ tone: "code", text: 'import { cruelModel, presets } from "cruel/ai-sdk"' },
	{ tone: "dim", text: "" },
	{ tone: "code", text: 'const model = cruelModel(openai("gpt-4o"), {' },
	{ tone: "code", text: "  ...presets.nightmare," },
	{ tone: "code", text: "  timeout: 0.2," },
	{ tone: "code", text: "})" },
]

const streamrows: readonly row[] = [
	{ tone: "code", text: 'const model = cruelModel(openai("gpt-4o"), {' },
	{ tone: "code", text: "  slowTokens: [40, 120]," },
	{ tone: "code", text: "  corruptChunks: 0.03," },
	{ tone: "code", text: "  streamCut: 0.05," },
	{ tone: "code", text: "})" },
	{ tone: "dim", text: "" },
	{ tone: "code", text: "const result = streamText({ model, prompt })" },
	{ tone: "code", text: "for await (const part of result.fullStream) {" },
	{ tone: "code", text: "  consume(part)" },
	{ tone: "code", text: "}" },
]

const diagnosticrows: readonly row[] = [
	{ tone: "code", text: 'import { cruelModel } from "cruel/ai-sdk"' },
	{ tone: "code", text: "const events = [] as string[]" },
	{ tone: "code", text: "const model = cruelModel(openai('gpt-4o'), {" },
	{ tone: "code", text: "  onChaos: (event) => events.push(event.type)," },
	{ tone: "code", text: "})" },
	{ tone: "dim", text: "" },
	{ tone: "code", text: "await generateText({ model, prompt })" },
	{ tone: "code", text: "const counts = events.reduce(group, {})" },
	{ tone: "code", text: "console.log(counts)" },
]

function LearnMore({ href, label }: { readonly href: string; readonly label: string }) {
	return (
		<Link
			href={href}
			className="inline-flex items-center gap-1.5 text-sm font-medium text-(--cursor-accent) hover:opacity-80 transition-opacity"
		>
			{label} <span aria-hidden="true">→</span>
		</Link>
	)
}

function rowstyle(tone: row["tone"]): string {
	switch (tone) {
		case "cmd":
			return "text-white/78"
		case "dim":
			return "text-white/42"
		default:
			return "text-white/68"
	}
}

function Panel({ rows }: { readonly rows: readonly row[] }) {
	return (
		<div className="flex h-[250px] flex-col bg-[#050505]">
			<div className="flex-1 px-4 py-3 font-mono text-[12px] leading-[1.62] tabular-nums">
				{rows.map((entry, index) => (
					<div key={`${entry.text}-${index}`} className={rowstyle(entry.tone)}>
						{entry.text || "\u00A0"}
					</div>
				))}
			</div>
		</div>
	)
}

function Spotlight({
	tone,
	title,
	description,
	bullets,
	linkHref,
	linkLabel,
	flip,
	window,
}: {
	readonly tone: "dune" | "mist" | "sage"
	readonly title: string
	readonly description: string
	readonly bullets: readonly string[]
	readonly linkHref: string
	readonly linkLabel: string
	readonly flip?: boolean
	readonly window: ReactNode
}) {
	return (
		<div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
			<div className={flip ? "order-2 md:order-2" : "order-2 md:order-1"}>
				<h2 className="text-3xl font-semibold tracking-tighter text-white sm:text-4xl">
					{title}
				</h2>
				<p className="mt-5 text-lg text-[#A1A1A1] leading-relaxed">{description}</p>
				<ul className="mt-8 space-y-3">
					{bullets.map((b) => (
						<li key={b} className="flex items-center gap-3 text-white/85">
							<span className="h-1.5 w-1.5 rounded-full bg-white/80" />
							{b}
						</li>
					))}
				</ul>
				<div className="mt-8">
					<LearnMore href={linkHref} label={linkLabel} />
				</div>
			</div>

			<div className={flip ? "order-1 md:order-1" : "order-1 md:order-2"}>
				<CursorStage tone={tone} square>
					<div className="mx-auto w-full max-w-[1160px]">
						<CursorMacWindow title="" bar={false}>
							{window}
						</CursorMacWindow>
					</div>
				</CursorStage>
			</div>
		</div>
	)
}

export function CursorFeatures() {
	return (
		<section>
			<div className="mx-auto max-w-[1320px] px-6 pt-20 pb-20 md:pt-28 md:pb-28">
				<div className="space-y-16 md:space-y-28">
					<Spotlight
						tone="mist"
						title="Chaos presets that feel like production."
						description="Cruel gives you realistic failure timing, not just random errors. Use presets for quick coverage, then tune per-model and per-api options when you need precision."
						bullets={[
							"realistic / unstable / harsh / nightmare / apocalypse",
							"deterministic seeds for reproducible failures",
							"hook into every chaos event via onChaos",
						]}
						linkHref="/docs/advanced#presets"
						linkLabel="Explore presets"
						window={<Panel rows={presetrows} />}
					/>

					<Spotlight
						tone="sage"
						title="Streaming chaos you can actually test."
						description="Streaming fails differently. Cruel can slow tokens, corrupt deltas, and cut streams mid-flight to prove your UI and service retry logic are solid."
						bullets={[
							"slowTokens (typing under pressure)",
							"corruptChunks (bad deltas, weird bytes)",
							"streamCut (mid-transfer termination)",
						]}
						linkHref="/docs/aisdk#streaming-with-chaos"
						linkLabel="Learn streaming chaos"
						flip
						window={<Panel rows={streamrows} />}
					/>

					<Spotlight
						tone="dune"
						title="Diagnostics your team can ship with."
						description="Track chaos events per request, measure latency distribution, and spot resilience gaps with a clean timeline. Cruel helps you fix real bugs in models and services."
						bullets={[
							"group events by request id",
							"compute p50/p95/p99 latency",
							"count retries and failures accurately",
						]}
						linkHref="/docs/core#diagnostics"
						linkLabel="See diagnostics"
						window={<Panel rows={diagnosticrows} />}
					/>
				</div>
			</div>
		</section>
	)
}
