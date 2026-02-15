import { gateway } from "@ai-sdk/gateway"
import { stepCountIs, streamText, tool } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { z } from "zod"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(gateway("openai/gpt-4o"), {
		slowTokens: [30, 150],
		delay: [50, 200],
		onChaos: log,
	})

	const result = streamText({
		model,
		tools: {
			calculate: tool({
				description: "Evaluate a math expression",
				inputSchema: z.object({ expression: z.string() }),
				execute: async ({ expression }) => String(Number(expression)),
			}),
		},
		stopWhen: stepCountIs(3),
		prompt: "What is 128 * 256?",
	})

	for await (const chunk of result.fullStream) {
		if (chunk.type === "text-delta") {
			process.stdout.write(chunk.text)
		}
		if (chunk.type === "tool-call") {
			print("\ntool call:", chunk.toolName)
		}
	}

	console.log()
	print("usage:", await result.usage)
})
