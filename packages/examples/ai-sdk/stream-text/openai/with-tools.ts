import { openai } from "@ai-sdk/openai"
import { stepCountIs, streamText, tool } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { z } from "zod"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(openai("gpt-4o"), {
		slowTokens: [30, 150],
		delay: [50, 200],
		onChaos: log,
	})

	const result = streamText({
		model,
		tools: {
			weather: tool({
				description: "Get current weather",
				inputSchema: z.object({ city: z.string() }),
				execute: async ({ city }) => `${city}: 72F, sunny`,
			}),
		},
		stopWhen: stepCountIs(3),
		prompt: "What is the weather in Tokyo?",
	})

	for await (const chunk of result.fullStream) {
		if (chunk.type === "text-delta") {
			process.stdout.write(chunk.text)
		}
		if (chunk.type === "tool-call") {
			print("tool call:", chunk.toolName)
		}
	}

	console.log()
	print("usage:", await result.usage)
})
