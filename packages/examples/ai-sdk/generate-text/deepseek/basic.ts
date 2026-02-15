import { deepseek } from "@ai-sdk/deepseek"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(deepseek("deepseek-chat"), {
		rateLimit: 0.2,
		delay: [100, 500],
		partialResponse: 0.1,
		onChaos: log,
	})

	const result = await generateText({
		model,
		prompt: "Explain the difference between TCP and UDP.",
	})

	print("text:", result.text)
	print("usage:", result.usage)
})
