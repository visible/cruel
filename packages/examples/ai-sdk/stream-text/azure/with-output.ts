import { azure } from "@ai-sdk/azure"
import { Output, streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { z } from "zod"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(azure("gpt-4o"), {
		slowTokens: [30, 100],
		partialResponse: 0.2,
		onChaos: log,
	})

	const result = streamText({
		model,
		output: Output.object({
			schema: z.object({
				title: z.string(),
				summary: z.string(),
				tags: z.array(z.string()),
			}),
		}),
		prompt: "Describe the movie Inception.",
	})

	for await (const partial of result.partialOutputStream) {
		console.clear()
		print("partial:", partial)
	}

	print("final:", await result.output)
})
