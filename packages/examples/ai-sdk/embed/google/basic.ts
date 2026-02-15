import { google } from "@ai-sdk/google"
import { embed } from "ai"
import { cruelEmbeddingModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelEmbeddingModel(google.embedding("text-embedding-004"), {
		rateLimit: 0.15,
		delay: [50, 300],
		onChaos: log,
	})

	const { embedding, usage } = await embed({
		model,
		value: "machine learning fundamentals",
	})

	print("dimensions:", embedding.length)
	print("usage:", usage)
})
