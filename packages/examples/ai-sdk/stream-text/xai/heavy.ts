import { xai } from "@ai-sdk/xai"
import { streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(xai("grok-3-fast"), {
		rateLimit: 0.3,
		overloaded: 0.15,
		delay: [500, 2000],
		slowTokens: [100, 500],
		streamCut: 0.2,
		corruptChunks: 0.1,
		partialResponse: 0.15,
		fail: 0.1,
		onChaos: log,
	})

	for (let i = 0; i < 10; i++) {
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
