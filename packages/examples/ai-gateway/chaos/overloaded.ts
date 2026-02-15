import { gateway } from "@ai-sdk/gateway"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../lib/chaos"
import { print } from "../../lib/print"
import { run } from "../../lib/run"

run(async () => {
	const model = cruelModel(gateway("anthropic/claude-sonnet-4-5-20250929"), {
		overloaded: 0.4,
		delay: [200, 1000],
		onChaos: log,
	})

	for (let i = 0; i < 8; i++) {
		const start = Date.now()
		try {
			const result = await generateText({
				model,
				prompt: `Request ${i + 1}: Say hello.`,
				maxRetries: 2,
			})
			print(`[${i + 1}] ${Date.now() - start}ms:`, result.text.slice(0, 60))
		} catch (e) {
			print(`[${i + 1}] ${Date.now() - start}ms failed:`, (e as Error).message)
		}
	}
})
