import { openai } from "@ai-sdk/openai"
import { generateText, wrapLanguageModel } from "ai"
import { cruelMiddleware } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = wrapLanguageModel({
		model: openai("gpt-4o"),
		middleware: cruelMiddleware({
			rateLimit: 0.2,
			overloaded: 0.1,
			delay: [100, 300],
			onChaos: log,
		}),
	})

	const result = await generateText({
		model,
		prompt: "Explain quantum computing in one sentence.",
	})

	print("text:", result.text)
})
