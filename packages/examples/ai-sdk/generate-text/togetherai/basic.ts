import { togetherai } from "@ai-sdk/togetherai"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(togetherai("meta-llama/Llama-3.3-70B-Instruct-Turbo"), {
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
