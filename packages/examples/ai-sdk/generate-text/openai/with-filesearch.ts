import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(openai("gpt-4o"), {
		rateLimit: 0.1,
		delay: [100, 500],
		onChaos: log,
	})

	const result = await generateText({
		model,
		tools: {
			file_search: openai.tools.fileSearch({
				vectorStoreIds: ["vs_example"],
			}),
		},
		prompt: "Search the uploaded documents for information about chaos engineering.",
	})

	print("text:", result.text)
	print("usage:", result.usage)
})
