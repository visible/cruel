import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(groq("llama-3.1-8b-instant"), {
		rateLimit: 0.25,
		overloaded: 0.1,
		onChaos: log,
	})

	const result = await generateText({
		model,
		prompt: "Name three unusual facts about octopuses.",
	})

	print("text:", result.text)
	print("usage:", result.usage)
})
