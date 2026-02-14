import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { cruelModel, presets } from "cruel/ai-sdk"
import { log } from "../../lib/chaos"
import { print } from "../../lib/print"
import { run } from "../../lib/run"

run(async () => {
	const model = cruelModel(openai("gpt-4o"), { ...presets.realistic, onChaos: log })

	for (let i = 0; i < 10; i++) {
		try {
			const result = await generateText({
				model,
				prompt: `Request ${i + 1}: Tell me a fun fact.`,
				maxRetries: 2,
			})
			print(`[${i + 1}] success:`, result.text.slice(0, 80))
		} catch (e) {
			print(`[${i + 1}] error:`, (e as Error).message)
		}
	}
})
