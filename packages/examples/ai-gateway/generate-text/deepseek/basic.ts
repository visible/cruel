import { gateway } from "@ai-sdk/gateway"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(gateway("deepseek/deepseek-chat"), {
		rateLimit: 0.2,
		delay: [100, 500],
		partialResponse: 0.1,
		onChaos: log,
	})

	const result = await generateText({
		model,
		prompt: "Explain the CAP theorem in simple terms.",
	})

	print("text:", result.text)
	print("usage:", result.usage)
})
