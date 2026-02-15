import { gateway } from "@ai-sdk/gateway"
import { generateText, stepCountIs, tool } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { z } from "zod"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(gateway("mistral/mistral-large-latest"), {
		rateLimit: 0.1,
		toolFailure: 0.2,
		delay: [100, 300],
		onChaos: log,
	})

	const result = await generateText({
		model,
		tools: {
			weather: tool({
				description: "Get current weather for a city",
				inputSchema: z.object({ city: z.string() }),
				execute: async ({ city }) => `${city}: 22C, partly cloudy`,
			}),
		},
		stopWhen: stepCountIs(5),
		prompt: "What is the weather in Berlin?",
	})

	print("text:", result.text)
	print("steps:", result.steps.length)
})
