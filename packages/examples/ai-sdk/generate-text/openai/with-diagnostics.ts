import { openai } from "@ai-sdk/openai"
import { generateText, APICallError } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import type { ChaosEvent } from "cruel/ai-sdk"
import { run } from "../../../lib/run"

const dim = "\x1b[2m"
const red = "\x1b[31m"
const green = "\x1b[32m"
const yellow = "\x1b[33m"
const cyan = "\x1b[36m"
const reset = "\x1b[0m"

type Entry = ChaosEvent & { ts: number }

run(async () => {
	const events: Entry[] = []
	const start = performance.now()

	const model = cruelModel(openai("gpt-4o"), {
		rateLimit: 0.3,
		overloaded: 0.15,
		contextLength: 0.05,
		contentFilter: 0.05,
		modelUnavailable: 0.1,
		emptyResponse: 0.05,
		partialResponse: 0.2,
		delay: [200, 1500],
		fail: 0.1,
		timeout: 0.02,
		onChaos: (event) => {
			events.push({ ...event, ts: Math.round(performance.now() - start) })
		},
	})

	let succeeded = 0
	let failed = 0
	const errors: Array<{ i: number; message: string; status?: number; retryable?: boolean }> = []

	for (let i = 0; i < 15; i++) {
		const reqStart = performance.now()
		try {
			const result = await generateText({
				model,
				prompt: `Request ${i + 1}: Tell me a fact.`,
				maxRetries: 2,
			})
			succeeded++
			const ms = Math.round(performance.now() - reqStart)
			const truncated = result.text.length > 60
			const text = result.text.slice(0, 60) + (truncated ? "..." : "")
			console.log(`  ${green}\u2713${reset} ${dim}[${i + 1}]${reset} ${dim}${ms}ms${reset} ${text}`)
		} catch (e) {
			failed++
			const ms = Math.round(performance.now() - reqStart)
			const err = e as Error
			const entry: { i: number; message: string; status?: number; retryable?: boolean } = {
				i: i + 1,
				message: err.message,
			}
			if (APICallError.isInstance(e)) {
				entry.status = e.statusCode
				entry.retryable = e.isRetryable
			}
			errors.push(entry)
			console.log(`  ${red}\u2717${reset} ${dim}[${i + 1}]${reset} ${dim}${ms}ms${reset} ${red}${err.message}${reset}`)
		}
	}

	const total = Math.round(performance.now() - start)
	const counts: Record<string, number> = {}
	for (const e of events) {
		counts[e.type] = (counts[e.type] || 0) + 1
	}

	console.log(`\n${cyan}\u2500\u2500\u2500 diagnostics \u2500\u2500\u2500${reset}\n`)

	console.log(`  ${dim}duration${reset}    ${total}ms`)
	console.log(`  ${dim}requests${reset}    ${succeeded + failed}`)
	console.log(`  ${green}succeeded${reset}   ${succeeded}`)
	console.log(`  ${red}failed${reset}      ${failed}`)
	console.log(`  ${dim}success %${reset}   ${Math.round((succeeded / (succeeded + failed)) * 100)}%`)

	console.log(`\n  ${dim}chaos events (${events.length} total)${reset}`)
	for (const [type, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
		const bar = "\u2588".repeat(count)
		const color = type.includes("delay") || type.includes("slow") || type.includes("partial") ? yellow : red
		console.log(`    ${color}${bar}${reset} ${dim}${type}${reset} ${dim}(${count})${reset}`)
	}

	if (errors.length > 0) {
		console.log(`\n  ${dim}error details${reset}`)
		for (const e of errors) {
			const status = e.status ? ` ${dim}status=${e.status}${reset}` : ""
			const retry = e.retryable !== undefined ? ` ${dim}retryable=${e.retryable}${reset}` : ""
			console.log(`    ${dim}[${e.i}]${reset} ${e.message}${status}${retry}`)
		}
	}

	console.log(`\n  ${dim}timeline${reset}`)
	for (const e of events) {
		const model = "modelId" in e ? e.modelId : ""
		const ms = "ms" in e ? ` ${e.ms}ms` : ""
		console.log(`    ${dim}${String(e.ts).padStart(6)}ms${reset} ${e.type} ${dim}${model}${ms}${reset}`)
	}
})
