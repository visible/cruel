import { cohere } from "@ai-sdk/cohere"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(cohere("command-r-plus"), {
		rateLimit: 0.2,
		overloaded: 0.05,
		delay: [100, 400],
		onChaos: log,
	})

	const result = await generateText({
		model,
		prompt: "Compare the Roman Empire to modern corporations.",
	})

	print("text:", result.text)
	print("usage:", result.usage)
})
