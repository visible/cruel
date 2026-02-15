import { gateway } from "@ai-sdk/gateway"
import { streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(gateway("xai/grok-4.1-fast-reasoning"), {
		slowTokens: [20, 100],
		streamCut: 0.05,
		onChaos: log,
	})

	const result = streamText({
		model,
		prompt: "What weighs more, a pound of feathers or a pound of steel?",
	})

	for await (const part of result.fullStream) {
		if (part.type === "reasoning-delta") {
			process.stdout.write(`\x1b[2m${part.text}\x1b[0m`)
		} else if (part.type === "text-delta") {
			process.stdout.write(part.text)
		}
	}

	console.log()
	print("usage:", await result.usage)
})
