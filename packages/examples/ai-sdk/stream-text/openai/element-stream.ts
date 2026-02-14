import { openai } from "@ai-sdk/openai"
import { Output, streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { z } from "zod"
import { log } from "../../../lib/chaos"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(openai("gpt-4o"), {
		slowTokens: [50, 200],
		corruptChunks: 0.02,
		onChaos: log,
	})

	const result = streamText({
		model,
		output: Output.array({
			element: z.object({
				city: z.string(),
				country: z.string(),
				population: z.number(),
			}),
		}),
		prompt: "List 10 major cities with their populations.",
	})

	for await (const element of result.elementStream) {
		console.log("city:", element)
	}
})
