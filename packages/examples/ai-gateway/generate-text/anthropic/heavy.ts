import { gateway } from "@ai-sdk/gateway"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(gateway("anthropic/claude-sonnet-4-5-20250929"), {
		rateLimit: 0.4,
		overloaded: 0.2,
		contextLength: 0.1,
		contentFilter: 0.05,
		modelUnavailable: 0.1,
		emptyResponse: 0.1,
		partialResponse: 0.2,
		delay: [500, 3000],
		fail: 0.1,
		timeout: 0.05,
		onChaos: log,
	})

	for (let i = 0; i < 20; i++) {
		try {
			const result = await generateText({
				model,
				prompt: `Request ${i + 1}: Tell me a fact.`,
				maxRetries: 2,
			})
			print(`[${i + 1}] ok:`, result.text.slice(0, 80))
		} catch (e) {
			print(`[${i + 1}] fail:`, (e as Error).message)
		}
	}
})
