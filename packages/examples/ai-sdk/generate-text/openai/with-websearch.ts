import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(openai("gpt-4o"), {
		rateLimit: 0.15,
		delay: [200, 800],
		onChaos: log,
	})

	const result = await generateText({
		model,
		tools: {
			web_search: openai.tools.webSearch(),
		},
		prompt: "What happened in tech news today?",
	})

	print("text:", result.text)
	print("usage:", result.usage)
})
