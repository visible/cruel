import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(anthropic("claude-sonnet-4-5-20250929"), {
		rateLimit: 0.2,
		overloaded: 0.1,
		delay: [200, 800],
		onChaos: log,
	})

	const result = await generateText({
		model,
		prompt: "Explain why the sky changes color at sunset.",
	})

	print("text:", result.text)
	print("usage:", result.usage)
})
