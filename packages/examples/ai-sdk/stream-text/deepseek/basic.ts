import { deepseek } from "@ai-sdk/deepseek"
import { streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(deepseek("deepseek-chat"), {
		slowTokens: [30, 150],
		corruptChunks: 0.03,
		onChaos: log,
	})

	const result = streamText({
		model,
		prompt: "Explain the concept of recursion using a real-world analogy.",
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
