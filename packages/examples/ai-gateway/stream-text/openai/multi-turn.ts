import { gateway } from "@ai-sdk/gateway"
import { streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelModel(gateway("openai/gpt-4o"), {
		rateLimit: 0.1,
		slowTokens: [20, 80],
		delay: [100, 300],
		onChaos: log,
	})

	const messages: Array<{ role: "user" | "assistant"; content: string }> = []
	const prompts = ["My name is Alex.", "What is my name?", "Now spell it backwards."]

	for (const prompt of prompts) {
		messages.push({ role: "user", content: prompt })

		const result = streamText({ model, messages })
		let response = ""

		for await (const chunk of result.textStream) {
			process.stdout.write(chunk)
			response += chunk
		}

		console.log()
		messages.push({ role: "assistant", content: response })
	}

	print("turns:", messages.length)
})
