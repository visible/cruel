import { gateway } from "@ai-sdk/gateway"
import { streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(gateway("google/gemini-2.5-flash"), {
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
			const text = await result.text
			if (text) process.stdout.write(text)
			console.log()
		} catch (e) {
			console.log(`failed: ${(e as Error).message}`)
		}
	}
})
