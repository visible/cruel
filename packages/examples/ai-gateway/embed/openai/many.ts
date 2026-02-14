import { gateway } from "@ai-sdk/gateway"
import { embedMany } from "ai"
import { cruelEmbeddingModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelEmbeddingModel(gateway.embeddingModel("openai/text-embedding-3-small"), {
		rateLimit: 0.15,
		delay: [100, 500],
		onChaos: log,
	})

	const { embeddings, usage } = await embedMany({
		model,
		values: [
			"rate limiting in distributed systems",
			"circuit breaker pattern",
			"chaos engineering principles",
			"fault injection testing",
			"resilience patterns for microservices",
		],
	})

	print("count:", embeddings.length)
	print("dimensions:", embeddings[0].length)
	print("usage:", usage)
})
