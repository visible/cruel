import { togetherai } from "@ai-sdk/togetherai"
import { streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(togetherai("meta-llama/Llama-3.3-70B-Instruct-Turbo"), {
		slowTokens: [20, 100],
		streamCut: 0.05,
		onChaos: log,
	})

	const result = streamText({
		model,
		prompt: "Write a short poem about the stars.",
	})

	for await (const chunk of result.fullStream) {
		if (chunk.type === "text-delta") {
			process.stdout.write(chunk.text)
		}
		if (chunk.type === "error") {
			console.error("\nstream error:", chunk.error)
		}
	}

	console.log()
	print("usage:", await result.usage)
	print("finish reason:", await result.finishReason)
})
