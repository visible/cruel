import { groq } from "@ai-sdk/groq"
import { streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(groq("llama-3.1-8b-instant"), {
		slowTokens: [10, 50],
		streamCut: 0.03,
		onChaos: log,
	})

	const result = streamText({
		model,
		prompt: "List five things that make a great team.",
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
