import { gateway } from "@ai-sdk/gateway"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../lib/chaos"
import { print } from "../../lib/print"
import { run } from "../../lib/run"

run(async () => {
	const providers = [
		"openai/gpt-4o",
		"anthropic/claude-sonnet-4-5-20250929",
		"google/gemini-2.5-flash",
	]

	for (let i = 0; i < 10; i++) {
		let succeeded = false
		for (const id of providers) {
			const model = cruelModel(gateway(id), {
				rateLimit: 0.5,
				overloaded: 0.3,
				delay: [100, 500],
				fail: 0.2,
				onChaos: log,
			})

			try {
				const result = await generateText({
					model,
					prompt: `Request ${i + 1}: Name a planet.`,
				})
				print(`[${i + 1}] ${id}:`, result.text.slice(0, 40))
				succeeded = true
				break
			} catch {
				continue
			}
		}
		if (!succeeded) {
			print(`[${i + 1}]`, "all providers failed")
		}
	}
})
