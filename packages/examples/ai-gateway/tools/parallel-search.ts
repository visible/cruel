import { gateway } from "@ai-sdk/gateway"
import { streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../lib/chaos"
import { print } from "../../lib/print"
import { run } from "../../lib/run"

run(async () => {
	const model = cruelModel(gateway("anthropic/claude-sonnet-4-5-20250929"), {
		slowTokens: [20, 100],
		delay: [100, 500],
		onChaos: log,
	})

	const result = streamText({
		model,
		tools: {
			parallel_search: gateway.tools.parallelSearch(),
		},
		prompt: "Compare the latest iPhone and Samsung Galaxy flagship phones.",
	})

	for await (const part of result.fullStream) {
		if (part.type === "text-delta") {
			process.stdout.write(part.text)
		} else if (part.type === "tool-call") {
			print("\ntool:", part.toolName)
		}
	}

	console.log()
	print("usage:", await result.usage)
})
