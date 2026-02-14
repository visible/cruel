import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(openai("gpt-4o"), {
		rateLimit: 0.3,
		delay: [100, 500],
		onChaos: log,
	})

	const result = await generateText({
		model,
		prompt: "Invent a new holiday and describe its traditions.",
	})

	print("text:", result.text)
	print("usage:", result.usage)
	print("finish reason:", result.finishReason)
})
