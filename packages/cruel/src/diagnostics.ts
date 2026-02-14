import type { ChaosEvent } from "./types.js"

type Entry = ChaosEvent & { ts: number; req: number }

type RequestResult = {
	id: number
	ok: boolean
	ms: number
	text?: string
	error?: string
	status?: number
	retryable?: boolean
	retries: number
	events: Entry[]
}

type DiagnosticsContext = {
	events: Entry[]
	requests: RequestResult[]
	start: number
	current: number
}

type EventCount = {
	type: string
	count: number
	percent: number
}

type LatencyStats = {
	avg: number
	p50: number
	p99: number
	min: number
	max: number
}

type DiagnosticsStats = {
	duration: number
	total: number
	succeeded: number
	failed: number
	successRate: number
	latency: {
		success: LatencyStats
		failure: LatencyStats
	}
	events: EventCount[]
	totalEvents: number
	requests: RequestResult[]
	errors: RequestResult[]
}

function percentile(arr: number[], p: number): number {
	if (!arr.length) return 0
	const sorted = [...arr].sort((a, b) => a - b)
	return sorted[Math.ceil(sorted.length * p) - 1]
}

function latency(times: number[]): LatencyStats {
	if (!times.length) return { avg: 0, p50: 0, p99: 0, min: 0, max: 0 }
	return {
		avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
		p50: percentile(times, 0.5),
		p99: percentile(times, 0.99),
		min: Math.min(...times),
		max: Math.max(...times),
	}
}

function context(): DiagnosticsContext {
	return { events: [], requests: [], start: performance.now(), current: 0 }
}

function tracker(ctx: DiagnosticsContext) {
	return (event: ChaosEvent) => {
		ctx.events.push({
			...event,
			ts: Math.round(performance.now() - ctx.start),
			req: ctx.current,
		})
	}
}

function before(ctx: DiagnosticsContext, id: number) {
	ctx.current = id
}

function success(ctx: DiagnosticsContext, id: number, ms: number, text: string) {
	const events = ctx.events.filter((e) => e.req === id)
	const retries = events.filter((e) =>
		["rateLimit", "overloaded", "modelUnavailable", "fail"].includes(e.type),
	).length
	ctx.requests.push({ id, ok: true, ms, text, retries, events })
}

function failure(ctx: DiagnosticsContext, id: number, ms: number, error: unknown) {
	const events = ctx.events.filter((e) => e.req === id)
	const retries = events.filter((e) =>
		["rateLimit", "overloaded", "modelUnavailable", "fail"].includes(e.type),
	).length
	const err = error as Error
	const req: RequestResult = { id, ok: false, ms, error: err.message, retries, events }
	if (typeof error === "object" && error !== null && "statusCode" in error) {
		req.status = (error as { statusCode: number }).statusCode
	}
	if (typeof error === "object" && error !== null && "isRetryable" in error) {
		req.retryable = (error as { isRetryable: boolean }).isRetryable
	}
	ctx.requests.push(req)
}

function stats(ctx: DiagnosticsContext): DiagnosticsStats {
	const duration = Math.round(performance.now() - ctx.start)
	const succeeded = ctx.requests.filter((r) => r.ok)
	const failed = ctx.requests.filter((r) => !r.ok)
	const total = ctx.requests.length

	const counts: Record<string, number> = {}
	for (const e of ctx.events) counts[e.type] = (counts[e.type] || 0) + 1

	const events: EventCount[] = Object.entries(counts)
		.sort((a, b) => b[1] - a[1])
		.map(([type, count]) => ({
			type,
			count,
			percent: ctx.events.length ? Math.round((count / ctx.events.length) * 100) : 0,
		}))

	return {
		duration,
		total,
		succeeded: succeeded.length,
		failed: failed.length,
		successRate: total ? succeeded.length / total : 0,
		latency: {
			success: latency(succeeded.map((r) => r.ms)),
			failure: latency(failed.map((r) => r.ms)),
		},
		events,
		totalEvents: ctx.events.length,
		requests: ctx.requests,
		errors: failed,
	}
}

const dim = "\x1b[2m"
const bold = "\x1b[1m"
const red = "\x1b[31m"
const green = "\x1b[32m"
const yellow = "\x1b[33m"
const cyan = "\x1b[36m"
const magenta = "\x1b[35m"
const reset = "\x1b[0m"

function print(ctx: DiagnosticsContext) {
	const s = stats(ctx)
	const maxCount = Math.max(...s.events.map((e) => e.count), 1)

	console.log(`\n  ${cyan}${bold}\u2500\u2500\u2500 summary \u2500\u2500\u2500${reset}\n`)
	console.log(`  ${dim}duration${reset}       ${s.duration}ms`)
	console.log(`  ${dim}requests${reset}       ${s.total}`)
	console.log(`  ${green}succeeded${reset}      ${s.succeeded} ${dim}(${Math.round(s.successRate * 100)}%)${reset}`)
	console.log(`  ${red}failed${reset}         ${s.failed} ${dim}(${Math.round((1 - s.successRate) * 100)}%)${reset}`)

	console.log(`\n  ${cyan}${bold}\u2500\u2500\u2500 latency \u2500\u2500\u2500${reset}\n`)
	if (s.latency.success.avg) {
		const l = s.latency.success
		console.log(`  ${green}success${reset}  ${dim}avg${reset} ${l.avg}ms  ${dim}p50${reset} ${l.p50}ms  ${dim}p99${reset} ${l.p99}ms  ${dim}min${reset} ${l.min}ms  ${dim}max${reset} ${l.max}ms`)
	}
	if (s.latency.failure.avg) {
		const l = s.latency.failure
		console.log(`  ${red}failure${reset}  ${dim}avg${reset} ${l.avg}ms  ${dim}p50${reset} ${l.p50}ms  ${dim}p99${reset} ${l.p99}ms  ${dim}min${reset} ${l.min}ms  ${dim}max${reset} ${l.max}ms`)
	}

	console.log(`\n  ${cyan}${bold}\u2500\u2500\u2500 chaos events (${s.totalEvents}) \u2500\u2500\u2500${reset}\n`)
	for (const e of s.events) {
		const width = Math.max(1, Math.round((e.count / maxCount) * 20))
		const bar = "\u2588".repeat(width)
		const color = ["delay", "slowTokens", "partialResponse"].includes(e.type) ? yellow
			: ["corruptChunk"].includes(e.type) ? magenta : red
		console.log(`  ${color}${bar}${reset} ${e.type} ${dim}${e.count} (${e.percent}%)${reset}`)
	}

	if (s.errors.length > 0) {
		console.log(`\n  ${cyan}${bold}\u2500\u2500\u2500 errors \u2500\u2500\u2500${reset}\n`)
		for (const r of s.errors) {
			const status = r.status ? `${dim}${r.status}${reset} ` : ""
			const retryable = r.retryable !== undefined ? (r.retryable ? `${yellow}retryable${reset}` : `${red}fatal${reset}`) : ""
			const chaos = r.events.map((e) => e.type).join(" \u2192 ")
			console.log(`  ${dim}#${r.id}${reset} ${status}${r.error}`)
			console.log(`     ${retryable} ${dim}${r.ms}ms${reset} ${dim}[${chaos}]${reset}`)
		}
	}

	console.log(`\n  ${cyan}${bold}\u2500\u2500\u2500 request timeline \u2500\u2500\u2500${reset}\n`)
	for (const r of s.requests) {
		const icon = r.ok ? `${green}\u2713${reset}` : `${red}\u2717${reset}`
		const chaos = r.events.map((e) => {
			const ms = "ms" in e ? `${dim}${e.ms}ms${reset}` : ""
			const color = ["delay", "slowTokens", "partialResponse"].includes(e.type) ? yellow
				: ["corruptChunk"].includes(e.type) ? magenta : red
			return `${color}${e.type}${reset}${ms ? ` ${ms}` : ""}`
		})
		const chaosStr = chaos.length ? chaos.join(` ${dim}\u2192${reset} `) : `${dim}clean${reset}`
		console.log(`  ${icon} ${dim}#${r.id}${reset} ${dim}${String(r.ms).padStart(5)}ms${reset}  ${chaosStr}`)
	}
}

export const diagnostics = { context, tracker, before, success, failure, stats, print }
export type { DiagnosticsContext, DiagnosticsStats, RequestResult, EventCount, LatencyStats }
