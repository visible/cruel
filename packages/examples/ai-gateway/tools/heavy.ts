import { gateway } from "@ai-sdk/gateway"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../lib/chaos"
import { print } from "../../lib/print"
import { run } from "../../lib/run"

run(async () => {
	const model = cruelModel(gateway("openai/gpt-4o"), {
		rateLimit: 0.3,
		overloaded: 0.15,
		delay: [500, 2000],
		toolFailure: 0.2,
		fail: 0.1,
		onChaos: log,
	})

	const prompts = [
		"What happened in AI news today?",
		"Compare Tesla and Rivian stock performance this week.",
		"What are the latest breakthroughs in fusion energy?",
	]

	for (let i = 0; i < prompts.length; i++) {
		try {
			const result = await generateText({
				model,
				tools: {
					perplexity_search: gateway.tools.perplexitySearch(),
				},
				prompt: prompts[i],
				maxRetries: 2,
			})
			print(`[${i + 1}] ok:`, result.text.slice(0, 100))
		} catch (e) {
			print(`[${i + 1}] fail:`, (e as Error).message)
		}
	}
})
