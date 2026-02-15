import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { cruelProvider } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const chaos = cruelProvider(openai, {
		rateLimit: 0.1,
		delay: [50, 200],
		onChaos: log,
	})

	const result = await generateText({
		model: chaos("gpt-4o"),
		prompt: "What is the meaning of life?",
	})

	print("text:", result.text)
})
