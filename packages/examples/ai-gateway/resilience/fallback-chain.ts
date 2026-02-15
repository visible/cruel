import { gateway } from "@ai-sdk/gateway"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../lib/chaos"
import { print } from "../../lib/print"
import { run } from "../../lib/run"

run(async () => {
	const providers = [
		{ model: gateway("openai/gpt-4o"), name: "openai" },
		{ model: gateway("anthropic/claude-sonnet-4-5-20250929"), name: "anthropic" },
		{ model: gateway("google/gemini-2.5-flash"), name: "google" },
	]

	const prompt = "What is the capital of France?"

	for (const { model: base, name } of providers) {
		const model = cruelModel(base, { rateLimit: 0.7, onChaos: log })

		try {
			const result = await generateText({ model, prompt })
			print(`${name} succeeded:`, result.text.slice(0, 80))
			break
		} catch {
			console.log(`${name} failed, trying next...`)
		}
	}
})
