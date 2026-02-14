import { gateway } from "@ai-sdk/gateway"
import { generateText, Output } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(gateway("anthropic/claude-sonnet-4-5-20250929"), {
		rateLimit: 0.1,
		delay: [50, 300],
		onChaos: log,
	})

	const result = await generateText({
		model,
		output: Output.choice({ options: ["positive", "negative", "neutral"] }),
		prompt: "Classify the sentiment: I love this product!",
	})

	print("classification:", result.output)
	print("usage:", result.usage)
})
