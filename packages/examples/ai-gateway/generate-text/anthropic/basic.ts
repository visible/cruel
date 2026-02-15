import { gateway } from "@ai-sdk/gateway"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(gateway("anthropic/claude-sonnet-4-5-20250929"), {
		rateLimit: 0.2,
		overloaded: 0.15,
		delay: [200, 800],
		onChaos: log,
	})

	const result = await generateText({
		model,
		prompt: "What makes a distributed system reliable?",
	})

	print("text:", result.text)
	print("usage:", result.usage)
})
