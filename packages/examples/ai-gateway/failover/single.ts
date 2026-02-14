import { gateway } from "@ai-sdk/gateway"
import { streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../lib/chaos"
import { print } from "../../lib/print"
import { run } from "../../lib/run"

run(async () => {
	const model = cruelModel(gateway("anthropic/claude-sonnet-4-5-20250929"), {
		rateLimit: 0.5,
		overloaded: 0.3,
		onChaos: log,
	})

	const result = streamText({
		model,
		prompt: "Say hello.",
		providerOptions: {
			gateway: {
				order: ["anthropic", "bedrock"],
			},
		},
	})

	for await (const text of result.textStream) {
		process.stdout.write(text)
	}

	console.log()
	const metadata = await result.providerMetadata
	print("provider metadata:", metadata)
})
