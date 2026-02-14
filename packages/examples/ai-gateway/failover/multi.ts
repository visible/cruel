import { gateway } from "@ai-sdk/gateway"
import { streamText } from "ai"
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

	for (const id of providers) {
		const model = cruelModel(gateway(id), {
			rateLimit: 0.6,
			overloaded: 0.3,
			delay: [200, 1000],
			onChaos: log,
		})

		try {
			const result = streamText({
				model,
				prompt: "Say hello in one word.",
				maxRetries: 1,
			})

			let text = ""
			for await (const chunk of result.textStream) {
				text += chunk
			}
			print(`${id}:`, text.trim())
			break
		} catch {
			console.log(`  ${id} failed, trying next...`)
		}
	}
})
