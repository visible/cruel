import { gateway } from "@ai-sdk/gateway"
import { streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(gateway("anthropic/claude-sonnet-4-5-20250929"), {
		slowTokens: [20, 100],
		streamCut: 0.05,
		onChaos: log,
	})

	const result = streamText({
		model,
		prompt: "What is the sum of prime numbers between 1 and 50?",
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
