import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(google("gemini-2.0-flash"), {
		rateLimit: 0.15,
		delay: [200, 800],
		onChaos: log,
	})

	const result = await generateText({
		model,
		tools: {
			google_search: google.tools.googleSearch(),
		},
		prompt: "What are the latest developments in quantum computing?",
	})

	print("text:", result.text)
	print("usage:", result.usage)
})
