import type { ChaosEvent } from "cruel/ai-sdk"
import { dim, red, yellow, cyan, magenta, reset } from "./colors"

const icons: Record<string, string> = {
	rateLimit: `${red}\u2717${reset}`,
	overloaded: `${red}\u2717${reset}`,
	contextLength: `${red}\u2717${reset}`,
	contentFilter: `${red}\u2717${reset}`,
	modelUnavailable: `${red}\u2717${reset}`,
	invalidApiKey: `${red}\u2717${reset}`,
	quotaExceeded: `${red}\u2717${reset}`,
	emptyResponse: `${red}\u2717${reset}`,
	fail: `${red}\u2717${reset}`,
	timeout: `${red}\u2717${reset}`,
	delay: `${yellow}\u25cf${reset}`,
	streamCut: `${red}\u2717${reset}`,
	slowTokens: `${yellow}\u25cf${reset}`,
	corruptChunk: `${magenta}\u25cf${reset}`,
	partialResponse: `${yellow}\u25cf${reset}`,
	toolFailure: `${red}\u2717${reset}`,
	toolTimeout: `${red}\u2717${reset}`,
}

const labels: Record<string, string> = {
	rateLimit: `${red}rate limit${reset}`,
	overloaded: `${red}overloaded${reset}`,
	contextLength: `${red}context length${reset}`,
	contentFilter: `${red}content filter${reset}`,
	modelUnavailable: `${red}model unavailable${reset}`,
	invalidApiKey: `${red}invalid api key${reset}`,
	quotaExceeded: `${red}quota exceeded${reset}`,
	emptyResponse: `${red}empty response${reset}`,
	fail: `${red}failure${reset}`,
	timeout: `${red}timeout${reset}`,
	delay: `${yellow}delay${reset}`,
	streamCut: `${red}stream cut${reset}`,
	slowTokens: `${yellow}slow tokens${reset}`,
	corruptChunk: `${magenta}corrupt chunk${reset}`,
	partialResponse: `${yellow}partial response${reset}`,
	toolFailure: `${red}tool failure${reset}`,
	toolTimeout: `${red}tool timeout${reset}`,
}

export function log(event: ChaosEvent) {
	const icon = icons[event.type] ?? `${cyan}\u25cf${reset}`
	const label = labels[event.type] ?? event.type
	const model = "modelId" in event ? `${dim}${event.modelId}${reset}` : ""
	const ms = "ms" in event ? `${dim}${event.ms}ms${reset}` : ""
	const parts = [icon, `${cyan}cruel${reset}`, label, model, ms].filter(Boolean)
	console.log(`  ${parts.join(" ")}`)
}
