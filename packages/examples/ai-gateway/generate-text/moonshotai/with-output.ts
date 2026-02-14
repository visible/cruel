import { gateway } from "@ai-sdk/gateway"
import { Output, generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { z } from "zod"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(gateway("moonshotai/kimi-k2.5"), {
		partialResponse: 0.3,
		delay: [200, 1000],
		onChaos: log,
	})

	const result = await generateText({
		model,
		output: Output.object({
			schema: z.object({
				recipe: z.object({
					name: z.string(),
					ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
					steps: z.array(z.string()),
				}),
			}),
		}),
		prompt: "Generate a pancake recipe.",
	})

	print("output:", result.output)
	print("usage:", result.usage)
})
