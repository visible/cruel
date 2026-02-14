import { openai } from "@ai-sdk/openai"
import { generateText, APICallError } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import type { ChaosEvent } from "cruel/ai-sdk"
import { run } from "../../../lib/run"

const dim = "\x1b[2m"
const bold = "\x1b[1m"
const red = "\x1b[31m"
const green = "\x1b[32m"
const yellow = "\x1b[33m"
const cyan = "\x1b[36m"
const magenta = "\x1b[35m"
const reset = "\x1b[0m"

type Entry = ChaosEvent & { ts: number; req: number }
type Req = {
	i: number
	ok: boolean
	ms: number
	text?: string
	error?: string
	status?: number
	retryable?: boolean
	retries: number
	events: Entry[]
}

run(async () => {
	const events: Entry[] = []
	const requests: Req[] = []
	const start = performance.now()
	let currentReq = 0

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
			const entry = { ...event, ts: Math.round(performance.now() - start), req: currentReq }
			events.push(entry)
		},
	})

	for (let i = 0; i < 15; i++) {
		currentReq = i + 1
		const reqStart = performance.now()
		const reqEvents = events.filter((e) => e.req === currentReq)
		const beforeCount = events.length

		try {
			const result = await generateText({
				model,
				prompt: `Request ${i + 1}: Tell me a fact.`,
				maxRetries: 2,
			})
			const ms = Math.round(performance.now() - reqStart)
			const afterEvents = events.filter((e) => e.req === currentReq)
			const retries = afterEvents.filter((e) =>
				["rateLimit", "overloaded", "modelUnavailable", "fail"].includes(e.type),
			).length
			const truncated = result.text.length > 55
			const text = result.text.slice(0, 55) + (truncated ? "..." : "")
			requests.push({ i: i + 1, ok: true, ms, text, retries, events: afterEvents })
			const retryTag = retries > 0 ? ` ${yellow}${retries} retries${reset}` : ""
			console.log(`  ${green}\u2713${reset} ${dim}#${i + 1}${reset} ${text} ${dim}${ms}ms${reset}${retryTag}`)
		} catch (e) {
			const ms = Math.round(performance.now() - reqStart)
			const err = e as Error
			const afterEvents = events.filter((ev) => ev.req === currentReq)
			const retries = afterEvents.filter((ev) =>
				["rateLimit", "overloaded", "modelUnavailable", "fail"].includes(ev.type),
			).length
			const req: Req = { i: i + 1, ok: false, ms, error: err.message, retries, events: afterEvents }
			if (APICallError.isInstance(e)) {
				req.status = e.statusCode
				req.retryable = e.isRetryable
			}
			requests.push(req)
			const statusTag = req.status ? ` ${dim}${req.status}${reset}` : ""
			const retryTag = retries > 1 ? ` ${dim}${retries} attempts${reset}` : ""
			console.log(`  ${red}\u2717${reset} ${dim}#${i + 1}${reset} ${red}${err.message}${reset}${statusTag}${retryTag}`)
		}
	}

	const total = Math.round(performance.now() - start)
	const succeeded = requests.filter((r) => r.ok)
	const failedReqs = requests.filter((r) => !r.ok)
	const successTimes = succeeded.map((r) => r.ms)
	const failTimes = failedReqs.map((r) => r.ms)

	const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0
	const p50 = (arr: number[]) => {
		if (!arr.length) return 0
		const sorted = [...arr].sort((a, b) => a - b)
		return sorted[Math.floor(sorted.length / 2)]
	}
	const p99 = (arr: number[]) => {
		if (!arr.length) return 0
		const sorted = [...arr].sort((a, b) => a - b)
		return sorted[Math.ceil(sorted.length * 0.99) - 1]
	}

	const counts: Record<string, number> = {}
	for (const e of events) counts[e.type] = (counts[e.type] || 0) + 1
	const maxBar = 20
	const maxCount = Math.max(...Object.values(counts), 1)

	console.log(`\n  ${cyan}${bold}\u2500\u2500\u2500 summary \u2500\u2500\u2500${reset}\n`)

	console.log(`  ${dim}duration${reset}       ${total}ms`)
	console.log(`  ${dim}requests${reset}       ${requests.length}`)
	console.log(`  ${green}succeeded${reset}      ${succeeded.length} ${dim}(${Math.round((succeeded.length / requests.length) * 100)}%)${reset}`)
	console.log(`  ${red}failed${reset}         ${failedReqs.length} ${dim}(${Math.round((failedReqs.length / requests.length) * 100)}%)${reset}`)

	console.log(`\n  ${cyan}${bold}\u2500\u2500\u2500 latency \u2500\u2500\u2500${reset}\n`)

	if (successTimes.length) {
		console.log(`  ${green}success${reset}  ${dim}avg${reset} ${avg(successTimes)}ms  ${dim}p50${reset} ${p50(successTimes)}ms  ${dim}p99${reset} ${p99(successTimes)}ms  ${dim}min${reset} ${Math.min(...successTimes)}ms  ${dim}max${reset} ${Math.max(...successTimes)}ms`)
	}
	if (failTimes.length) {
		console.log(`  ${red}failure${reset}  ${dim}avg${reset} ${avg(failTimes)}ms  ${dim}p50${reset} ${p50(failTimes)}ms  ${dim}p99${reset} ${p99(failTimes)}ms  ${dim}min${reset} ${Math.min(...failTimes)}ms  ${dim}max${reset} ${Math.max(...failTimes)}ms`)
	}

	console.log(`\n  ${cyan}${bold}\u2500\u2500\u2500 chaos events (${events.length}) \u2500\u2500\u2500${reset}\n`)

	for (const [type, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
		const width = Math.max(1, Math.round((count / maxCount) * maxBar))
		const bar = "\u2588".repeat(width)
		const pct = Math.round((count / events.length) * 100)
		const color = ["delay", "slowTokens", "partialResponse"].includes(type) ? yellow
			: ["corruptChunk"].includes(type) ? magenta
			: red
		console.log(`  ${color}${bar}${reset} ${type} ${dim}${count} (${pct}%)${reset}`)
	}

	if (failedReqs.length > 0) {
		console.log(`\n  ${cyan}${bold}\u2500\u2500\u2500 errors \u2500\u2500\u2500${reset}\n`)

		for (const r of failedReqs) {
			const status = r.status ? `${dim}${r.status}${reset} ` : ""
			const retryable = r.retryable !== undefined ? (r.retryable ? `${yellow}retryable${reset}` : `${red}fatal${reset}`) : ""
			const chaos = r.events.map((e) => e.type).join(" \u2192 ")
			console.log(`  ${dim}#${r.i}${reset} ${status}${r.error}`)
			console.log(`     ${retryable} ${dim}${r.ms}ms${reset} ${dim}[${chaos}]${reset}`)
		}
	}

	console.log(`\n  ${cyan}${bold}\u2500\u2500\u2500 request timeline \u2500\u2500\u2500${reset}\n`)

	for (const r of requests) {
		const icon = r.ok ? `${green}\u2713${reset}` : `${red}\u2717${reset}`
		const chaos = r.events.map((e) => {
			const ms = "ms" in e ? `${dim}${e.ms}ms${reset}` : ""
			const color = ["delay", "slowTokens", "partialResponse"].includes(e.type) ? yellow
				: ["corruptChunk"].includes(e.type) ? magenta
				: red
			return `${color}${e.type}${reset}${ms ? ` ${ms}` : ""}`
		})
		const chaosStr = chaos.length ? chaos.join(` ${dim}\u2192${reset} `) : `${dim}clean${reset}`
		console.log(`  ${icon} ${dim}#${r.i}${reset} ${dim}${String(r.ms).padStart(5)}ms${reset}  ${chaosStr}`)
	}
})
