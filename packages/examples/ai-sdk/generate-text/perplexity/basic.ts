import { perplexity } from "@ai-sdk/perplexity"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(perplexity("sonar-pro"), {
		rateLimit: 0.15,
		delay: [200, 700],
		onChaos: log,
	})

	const result = await generateText({
		model,
		prompt: "What are the latest trends in renewable energy?",
	})

	print("text:", result.text)
	print("usage:", result.usage)
})
