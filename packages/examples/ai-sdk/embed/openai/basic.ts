import { openai } from "@ai-sdk/openai"
import { embed } from "ai"
import { cruelEmbeddingModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelEmbeddingModel(openai.embedding("text-embedding-3-small"), {
		rateLimit: 0.2,
		delay: [50, 200],
		onChaos: log,
	})

	const { embedding, usage } = await embed({
		model,
		value: "sunny day at the beach",
	})

	print("dimensions:", embedding.length)
	print("usage:", usage)
})
