import { openai } from "@ai-sdk/openai"
import { generateText, stepCountIs, tool } from "ai"
import { cruelModel, cruelTool } from "cruel/ai-sdk"
import { z } from "zod"
import { log } from "../../lib/chaos"
import { print } from "../../lib/print"
import { run } from "../../lib/run"

run(async () => {
	const model = cruelModel(openai("gpt-4o"), { delay: [100, 300], onChaos: log })
	const chaosOpts = { toolFailure: 0.3, delay: [200, 1000] as [number, number], onChaos: log }

	const result = await generateText({
		model,
		tools: {
			search: cruelTool(
				tool({
					description: "Search the web",
					inputSchema: z.object({ query: z.string() }),
					execute: async ({ query }) => `results for: ${query}`,
				}),
				chaosOpts,
			),
			calculate: cruelTool(
				tool({
					description: "Calculate an expression",
					inputSchema: z.object({ expression: z.string() }),
					execute: async ({ expression }) => expression,
				}),
				chaosOpts,
			),
		},
		stopWhen: stepCountIs(5),
		prompt: "Search for the population of Tokyo then calculate 10% of it.",
	})

	print("text:", result.text)
	print("steps:", result.steps.length)
})
