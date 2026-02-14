import { openai } from "@ai-sdk/openai"
import { streamText, APICallError } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import type { ChaosEvent } from "cruel/ai-sdk"
import { run } from "../../../lib/run"

const dim = "\x1b[2m"
const red = "\x1b[31m"
const green = "\x1b[32m"
const yellow = "\x1b[33m"
const cyan = "\x1b[36m"
const magenta = "\x1b[35m"
const reset = "\x1b[0m"

type Entry = ChaosEvent & { ts: number }

run(async () => {
	const events: Entry[] = []
	const start = performance.now()

	const model = cruelModel(openai("gpt-4o"), {
		rateLimit: 0.2,
		overloaded: 0.1,
		delay: [200, 1000],
		slowTokens: [50, 300],
		streamCut: 0.15,
		corruptChunks: 0.05,
		partialResponse: 0.1,
		fail: 0.05,
		onChaos: (event) => {
			events.push({ ...event, ts: Math.round(performance.now() - start) })
		},
	})

	let succeeded = 0
	let failed = 0
	let totalTokens = 0
	let corruptedChunks = 0
	const errors: Array<{ i: number; message: string; status?: number }> = []

	for (let i = 0; i < 10; i++) {
		const reqStart = performance.now()
		try {
			const result = streamText({
				model,
				prompt: `Request ${i + 1}: Write a haiku.`,
			})

			let chunks = 0
			for await (const chunk of result.fullStream) {
				if (chunk.type === "text-delta") chunks++
			}

			const usage = await result.usage
			const tokens = usage?.totalTokens ?? 0
			totalTokens += tokens
			succeeded++
			const ms = Math.round(performance.now() - reqStart)
			console.log(`  ${green}\u2713${reset} ${dim}[${i + 1}]${reset} ${dim}${ms}ms${reset} ${dim}${chunks} chunks${reset} ${dim}${tokens} tokens${reset}`)
		} catch (e) {
			failed++
			const ms = Math.round(performance.now() - reqStart)
			const err = e as Error
			const entry: { i: number; message: string; status?: number } = {
				i: i + 1,
				message: err.message,
			}
			if (APICallError.isInstance(e)) entry.status = e.statusCode
			errors.push(entry)
			console.log(`  ${red}\u2717${reset} ${dim}[${i + 1}]${reset} ${dim}${ms}ms${reset} ${red}${err.message}${reset}`)
		}
	}

	const total = Math.round(performance.now() - start)
	const counts: Record<string, number> = {}
	for (const e of events) {
		counts[e.type] = (counts[e.type] || 0) + 1
	}
	corruptedChunks = counts["corruptChunk"] || 0

	console.log(`\n${cyan}\u2500\u2500\u2500 diagnostics \u2500\u2500\u2500${reset}\n`)

	console.log(`  ${dim}duration${reset}      ${total}ms`)
	console.log(`  ${dim}streams${reset}       ${succeeded + failed}`)
	console.log(`  ${green}succeeded${reset}     ${succeeded}`)
	console.log(`  ${red}failed${reset}        ${failed}`)
	console.log(`  ${dim}total tokens${reset}  ${totalTokens}`)
	if (corruptedChunks > 0) {
		console.log(`  ${magenta}corrupted${reset}     ${corruptedChunks} chunks`)
	}

	console.log(`\n  ${dim}chaos events (${events.length} total)${reset}`)
	for (const [type, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
		const bar = "\u2588".repeat(count)
		const color = ["delay", "slowTokens", "partialResponse"].includes(type) ? yellow
			: ["corruptChunk"].includes(type) ? magenta
			: red
		console.log(`    ${color}${bar}${reset} ${dim}${type}${reset} ${dim}(${count})${reset}`)
	}

	if (errors.length > 0) {
		console.log(`\n  ${dim}error details${reset}`)
		for (const e of errors) {
			const status = e.status ? ` ${dim}status=${e.status}${reset}` : ""
			console.log(`    ${dim}[${e.i}]${reset} ${e.message}${status}`)
		}
	}

	console.log(`\n  ${dim}timeline${reset}`)
	for (const e of events) {
		const model = "modelId" in e ? e.modelId : ""
		const ms = "ms" in e ? ` ${e.ms}ms` : ""
		console.log(`    ${dim}${String(e.ts).padStart(6)}ms${reset} ${e.type} ${dim}${model}${ms}${reset}`)
	}
})
