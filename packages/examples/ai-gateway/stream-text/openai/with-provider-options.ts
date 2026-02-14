import { gateway } from "@ai-sdk/gateway"
import { streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(gateway("anthropic/claude-sonnet-4-5-20250929"), {
		slowTokens: [20, 100],
		onChaos: log,
	})

	const result = streamText({
		model,
		prompt: "What makes a good distributed system?",
		providerOptions: {
			gateway: {
				only: ["anthropic"],
			},
		},
	})

	for await (const text of result.textStream) {
		process.stdout.write(text)
	}

	console.log()
	print("usage:", await result.usage)
	print("metadata:", await result.providerMetadata)
})
