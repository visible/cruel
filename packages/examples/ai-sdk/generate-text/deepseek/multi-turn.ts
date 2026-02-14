import { deepseek } from "@ai-sdk/deepseek"
import { generateText, stepCountIs, tool } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { z } from "zod"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(deepseek("deepseek-chat"), {
		rateLimit: 0.15,
		delay: [100, 500],
		onChaos: log,
	})

	const result = await generateText({
		model,
		tools: {
			search: tool({
				description: "Search the web",
				inputSchema: z.object({ query: z.string() }),
				execute: async ({ query }) => `results for: ${query}`,
			}),
			summarize: tool({
				description: "Summarize text",
				inputSchema: z.object({ text: z.string() }),
				execute: async ({ text }) => text.slice(0, 100),
			}),
		},
		stopWhen: stepCountIs(8),
		prompt: "Search for the latest AI news and summarize it.",
	})

	print("text:", result.text)
	print("steps:", result.steps.length)
	print("usage:", result.usage)
})
