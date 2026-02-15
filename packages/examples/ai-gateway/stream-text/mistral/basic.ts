import { gateway } from "@ai-sdk/gateway"
import { streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(gateway("mistral/mistral-large-latest"), {
		slowTokens: [25, 120],
		delay: [100, 400],
		onChaos: log,
	})

	const result = streamText({
		model,
		prompt: "Write a recipe for the perfect cup of coffee.",
	})

	for await (const chunk of result.fullStream) {
		if (chunk.type === "text-delta") {
			process.stdout.write(chunk.text)
		}
		if (chunk.type === "error") {
			console.error("\nstream error:", chunk.error)
		}
	}

	console.log()
	print("usage:", await result.usage)
})
