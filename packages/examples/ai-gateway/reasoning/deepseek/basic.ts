import { gateway } from "@ai-sdk/gateway"
import { streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(gateway("deepseek/deepseek-v3.1-thinking"), {
		slowTokens: [20, 100],
		streamCut: 0.05,
		onChaos: log,
	})

	const result = streamText({
		model,
		prompt: "How many r's are in strawberry?",
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
