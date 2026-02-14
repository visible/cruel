import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { cruelProvider } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const chaos = cruelProvider(openai, {
		rateLimit: 0.05,
		onChaos: log,
		models: {
			"gpt-4o": { rateLimit: 0.3, delay: [500, 2000] },
			"gpt-4o-mini": { rateLimit: 0.01 },
		},
	})

	console.log("testing gpt-4o (high chaos)...")
	try {
		const result = await generateText({
			model: chaos("gpt-4o"),
			prompt: "Hello",
		})
		print("text:", result.text)
	} catch (e) {
		print("error:", (e as Error).message)
	}

	console.log("testing gpt-4o-mini (low chaos)...")
	const result = await generateText({
		model: chaos("gpt-4o-mini"),
		prompt: "Hello",
	})
	print("text:", result.text)
})
