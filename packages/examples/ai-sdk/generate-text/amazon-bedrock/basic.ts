import { bedrock } from "@ai-sdk/amazon-bedrock"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(bedrock("anthropic.claude-sonnet-4-5-20250929-v1:0"), {
		rateLimit: 0.2,
		delay: [100, 500],
		onChaos: log,
	})

	const result = await generateText({
		model,
		prompt: "Explain what makes a good API design.",
	})

	print("text:", result.text)
	print("usage:", result.usage)
})
