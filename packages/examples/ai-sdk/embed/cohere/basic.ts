import { cohere } from "@ai-sdk/cohere"
import { embed } from "ai"
import { cruelEmbeddingModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelEmbeddingModel(cohere.embedding("embed-english-v3.0"), {
		rateLimit: 0.2,
		delay: [100, 400],
		onChaos: log,
	})

	const { embedding, usage } = await embed({
		model,
		value: "distributed systems architecture",
	})

	print("dimensions:", embedding.length)
	print("usage:", usage)
})
