import { gateway } from "@ai-sdk/gateway"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(gateway("openai/gpt-4o"), {
		rateLimit: 0.2,
		overloaded: 0.1,
		delay: [100, 500],
		onChaos: log,
	})

	const result = await generateText({
		model,
		prompt: "Explain chaos engineering in one sentence.",
	})

	print("text:", result.text)
	print("usage:", result.usage)
})
