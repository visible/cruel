import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../lib/chaos"
import { run } from "../../lib/run"

run(async () => {
	const model = cruelModel(openai("gpt-4o"), {
		streamCut: 0.3,
		corruptChunks: 0.1,
		slowTokens: [50, 200],
		onChaos: log,
	})

	for (let i = 0; i < 5; i++) {
		console.log(`\n--- stream ${i + 1} ---`)
		try {
			const result = streamText({
				model,
				prompt: `Request ${i + 1}: Write a haiku.`,
			})

			for await (const chunk of result.fullStream) {
				if (chunk.type === "text-delta") {
					process.stdout.write(chunk.text)
				}
				if (chunk.type === "error") {
					console.error("\nerror:", chunk.error)
				}
			}
			console.log()
		} catch (e) {
			console.log("failed:", (e as Error).message)
		}
	}
})
