import { xai } from "@ai-sdk/xai"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(xai("grok-3-fast"), {
		rateLimit: 0.15,
		delay: [50, 300],
		onChaos: log,
	})

	const result = await generateText({
		model,
		prompt: "What would happen if gravity was twice as strong?",
	})

	print("text:", result.text)
	print("usage:", result.usage)
})
