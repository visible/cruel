import { gateway } from "@ai-sdk/gateway"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(gateway("xai/grok-3-fast"), {
		rateLimit: 0.15,
		delay: [50, 300],
		onChaos: log,
	})

	const result = await generateText({
		model,
		prompt: "Why do programming languages have different paradigms?",
	})

	print("text:", result.text)
	print("usage:", result.usage)
})
