import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../lib/chaos"
import { print } from "../../lib/print"
import { run } from "../../lib/run"

run(async () => {
	const model = cruelModel(openai("gpt-4o"), {
		rateLimit: 0.15,
		overloaded: 0.1,
		delay: [200, 1000],
		partialResponse: 0.2,
		slowTokens: [50, 300],
		onChaos: log,
	})

	let successes = 0
	let failures = 0

	for (let i = 0; i < 10; i++) {
		const start = Date.now()
		try {
			const result = await generateText({
				model,
				prompt: `Request ${i + 1}: Name a color.`,
				maxRetries: 2,
			})
			successes++
			print(`[${i + 1}] ${Date.now() - start}ms:`, result.text.slice(0, 50))
		} catch (e) {
			failures++
			print(`[${i + 1}] ${Date.now() - start}ms failed:`, (e as Error).message)
		}
	}

	console.log(`\nsuccesses: ${successes}, failures: ${failures}`)
})
