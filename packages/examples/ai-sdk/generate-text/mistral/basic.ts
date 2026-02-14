import { mistral } from "@ai-sdk/mistral"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(mistral("mistral-large-latest"), {
		rateLimit: 0.2,
		delay: [150, 600],
		onChaos: log,
	})

	const result = await generateText({
		model,
		prompt: "What makes sourdough bread different from regular bread?",
	})

	print("text:", result.text)
	print("usage:", result.usage)
})
