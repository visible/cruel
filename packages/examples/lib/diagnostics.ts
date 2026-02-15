import { APICallError } from "ai"
import type { ChaosEvent } from "cruel/ai-sdk"
import { bold, cyan, dim, green, magenta, red, reset, yellow } from "./colors"

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

type Context = {
	events: Entry[]
	requests: Req[]
	start: number
	current: number
}

export function context(): Context {
	return { events: [], requests: [], start: performance.now(), current: 0 }
}

export function tracker(ctx: Context) {
	return (event: ChaosEvent) => {
		ctx.events.push({
			...event,
			ts: Math.round(performance.now() - ctx.start),
			req: ctx.current,
		})
	}
}

export function before(ctx: Context, i: number) {
	ctx.current = i
}

export function success(ctx: Context, i: number, ms: number, text: string) {
	const events = ctx.events.filter((e) => e.req === i)
	const retries = events.filter((e) =>
		["rateLimit", "overloaded", "modelUnavailable", "fail"].includes(e.type),
	).length
	const truncated = text.length > 55
	const display = text.slice(0, 55) + (truncated ? "..." : "")
	ctx.requests.push({ i, ok: true, ms, text: display, retries, events })
	const retryTag = retries > 0 ? ` ${yellow}${retries} retries${reset}` : ""
	console.log(
		`  ${green}\u2713${reset} ${dim}#${i}${reset} ${display} ${dim}${ms}ms${reset}${retryTag}`,
	)
}

export function failure(ctx: Context, i: number, ms: number, error: unknown) {
	const events = ctx.events.filter((e) => e.req === i)
	const retries = events.filter((e) =>
		["rateLimit", "overloaded", "modelUnavailable", "fail"].includes(e.type),
	).length
	const err = error as Error
	const req: Req = { i, ok: false, ms, error: err.message, retries, events }
	if (APICallError.isInstance(error)) {
		req.status = error.statusCode
		req.retryable = error.isRetryable
	}
	ctx.requests.push(req)
	const statusTag = req.status ? ` ${dim}${req.status}${reset}` : ""
	const retryTag = retries > 1 ? ` ${dim}${retries} attempts${reset}` : ""
	console.log(
		`  ${red}\u2717${reset} ${dim}#${i}${reset} ${red}${err.message}${reset}${statusTag}${retryTag}`,
	)
}

export function report(ctx: Context) {
	const total = Math.round(performance.now() - ctx.start)
	const succeeded = ctx.requests.filter((r) => r.ok)
	const failed = ctx.requests.filter((r) => !r.ok)
	const successTimes = succeeded.map((r) => r.ms)
	const failTimes = failed.map((r) => r.ms)

	const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0)
	const percentile = (a: number[], p: number) => {
		if (!a.length) return 0
		const s = [...a].sort((x, y) => x - y)
		return s[Math.ceil(s.length * p) - 1]
	}

	const counts: Record<string, number> = {}
	for (const e of ctx.events) counts[e.type] = (counts[e.type] || 0) + 1
	const maxCount = Math.max(...Object.values(counts), 1)

	console.log(`\n  ${cyan}${bold}\u2500\u2500\u2500 summary \u2500\u2500\u2500${reset}\n`)
	console.log(`  ${dim}duration${reset}       ${total}ms`)
	console.log(`  ${dim}requests${reset}       ${ctx.requests.length}`)
	console.log(
		`  ${green}succeeded${reset}      ${succeeded.length} ${dim}(${Math.round((succeeded.length / ctx.requests.length) * 100)}%)${reset}`,
	)
	console.log(
		`  ${red}failed${reset}         ${failed.length} ${dim}(${Math.round((failed.length / ctx.requests.length) * 100)}%)${reset}`,
	)

	console.log(`\n  ${cyan}${bold}\u2500\u2500\u2500 latency \u2500\u2500\u2500${reset}\n`)
	if (successTimes.length) {
		console.log(
			`  ${green}success${reset}  ${dim}avg${reset} ${avg(successTimes)}ms  ${dim}p50${reset} ${percentile(successTimes, 0.5)}ms  ${dim}p99${reset} ${percentile(successTimes, 0.99)}ms  ${dim}min${reset} ${Math.min(...successTimes)}ms  ${dim}max${reset} ${Math.max(...successTimes)}ms`,
		)
	}
	if (failTimes.length) {
		console.log(
			`  ${red}failure${reset}  ${dim}avg${reset} ${avg(failTimes)}ms  ${dim}p50${reset} ${percentile(failTimes, 0.5)}ms  ${dim}p99${reset} ${percentile(failTimes, 0.99)}ms  ${dim}min${reset} ${Math.min(...failTimes)}ms  ${dim}max${reset} ${Math.max(...failTimes)}ms`,
		)
	}

	console.log(
		`\n  ${cyan}${bold}\u2500\u2500\u2500 chaos events (${ctx.events.length}) \u2500\u2500\u2500${reset}\n`,
	)
	for (const [type, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
		const width = Math.max(1, Math.round((count / maxCount) * 20))
		const bar = "\u2588".repeat(width)
		const pct = Math.round((count / ctx.events.length) * 100)
		const color = ["delay", "slowTokens", "partialResponse"].includes(type)
			? yellow
			: ["corruptChunk"].includes(type)
				? magenta
				: red
		console.log(`  ${color}${bar}${reset} ${type} ${dim}${count} (${pct}%)${reset}`)
	}

	if (failed.length > 0) {
		console.log(`\n  ${cyan}${bold}\u2500\u2500\u2500 errors \u2500\u2500\u2500${reset}\n`)
		for (const r of failed) {
			const status = r.status ? `${dim}${r.status}${reset} ` : ""
			const retryable =
				r.retryable !== undefined
					? r.retryable
						? `${yellow}retryable${reset}`
						: `${red}fatal${reset}`
					: ""
			const chaos = r.events.map((e) => e.type).join(" \u2192 ")
			console.log(`  ${dim}#${r.i}${reset} ${status}${r.error}`)
			console.log(`     ${retryable} ${dim}${r.ms}ms${reset} ${dim}[${chaos}]${reset}`)
		}
	}

	console.log(`\n  ${cyan}${bold}\u2500\u2500\u2500 request timeline \u2500\u2500\u2500${reset}\n`)
	for (const r of ctx.requests) {
		const icon = r.ok ? `${green}\u2713${reset}` : `${red}\u2717${reset}`
		const chaos = r.events.map((e) => {
			const ms = "ms" in e ? `${dim}${e.ms}ms${reset}` : ""
			const color = ["delay", "slowTokens", "partialResponse"].includes(e.type)
				? yellow
				: ["corruptChunk"].includes(e.type)
					? magenta
					: red
			return `${color}${e.type}${reset}${ms ? ` ${ms}` : ""}`
		})
		const chaosStr = chaos.length ? chaos.join(` ${dim}\u2192${reset} `) : `${dim}clean${reset}`
		console.log(
			`  ${icon} ${dim}#${r.i}${reset} ${dim}${String(r.ms).padStart(5)}ms${reset}  ${chaosStr}`,
		)
	}
}
