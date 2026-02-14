import { bedrock } from "@ai-sdk/amazon-bedrock"
import { embed } from "ai"
import { cruelEmbeddingModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelEmbeddingModel(bedrock.embedding("amazon.titan-embed-text-v2:0"), {
		rateLimit: 0.2,
		delay: [50, 200],
		onChaos: log,
	})

	const { embedding, usage } = await embed({
		model,
		value: "chaos engineering for distributed systems",
	})

	print("dimensions:", embedding.length)
	print("usage:", usage)
})
