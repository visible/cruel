import { gateway } from "@ai-sdk/gateway"
import { streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(gateway("deepseek/deepseek-v3.1-thinking"), {
		rateLimit: 0.3,
		overloaded: 0.15,
		slowTokens: [100, 500],
		streamCut: 0.2,
		delay: [500, 2000],
		fail: 0.1,
		onChaos: log,
	})

	for (let i = 0; i < 5; i++) {
		console.log(`\n--- request ${i + 1} ---`)
		try {
			const result = streamText({
				model,
				prompt: `Request ${i + 1}: Solve 17 * 23 step by step.`,
			})

			for await (const part of result.fullStream) {
				if (part.type === "reasoning-delta") {
					process.stdout.write(`\x1b[2m${part.text}\x1b[0m`)
				} else if (part.type === "text-delta") {
					process.stdout.write(part.text)
				}
			}
			console.log()
		} catch (e) {
			console.log("failed:", (e as Error).message)
		}
	}
})
