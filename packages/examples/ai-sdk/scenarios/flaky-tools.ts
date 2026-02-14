import { openai } from "@ai-sdk/openai"
import { generateText, stepCountIs, tool } from "ai"
import type { CruelChaosOptions } from "cruel/ai-sdk"
import { cruelModel, cruelTool } from "cruel/ai-sdk"
import { z } from "zod"
import { log } from "../../lib/chaos"
import { print } from "../../lib/print"
import { run } from "../../lib/run"

run(async () => {
	const model = cruelModel(openai("gpt-4o"), { delay: [100, 300], onChaos: log })
	const chaosOpts: CruelChaosOptions = {
		toolFailure: 0.3,
		delay: [200, 1000],
		onChaos: log,
	}

	const search = tool({
		description: "Search the web",
		inputSchema: z.object({ query: z.string() }),
		execute: async ({ query }) => `results for: ${query}`,
	})

	const calculate = tool({
		description: "Calculate an expression",
		inputSchema: z.object({ expression: z.string() }),
		execute: async ({ expression }) => expression,
	})

	const result = await generateText({
		model,
		tools: {
			search: cruelTool(search, chaosOpts),
			calculate: cruelTool(calculate, chaosOpts),
		},
		stopWhen: stepCountIs(5),
		prompt: "Search for the population of Tokyo then calculate 10% of it.",
	})

	print("text:", result.text)
	print("steps:", result.steps.length)
})
