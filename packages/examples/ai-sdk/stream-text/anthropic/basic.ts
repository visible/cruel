import { anthropic } from "@ai-sdk/anthropic"
import { streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(anthropic("claude-sonnet-4-5-20250929"), {
		slowTokens: [30, 150],
		streamCut: 0.08,
		corruptChunks: 0.02,
		onChaos: log,
	})

	const result = streamText({
		model,
		prompt: "Explain how neural networks learn, as if teaching a child.",
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
})
