import { openai } from "@ai-sdk/openai"
import { embedMany } from "ai"
import { cruelEmbeddingModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelEmbeddingModel(openai.embedding("text-embedding-3-small"), {
		rateLimit: 0.4,
		overloaded: 0.2,
		delay: [200, 1000],
		invalidApiKey: 0.05,
		quotaExceeded: 0.05,
		fail: 0.1,
		onChaos: log,
	})

	for (let i = 0; i < 10; i++) {
		try {
			const { embeddings, usage } = await embedMany({
				model,
				values: [
					`batch ${i + 1} item a`,
					`batch ${i + 1} item b`,
					`batch ${i + 1} item c`,
				],
			})
			print(`[${i + 1}] ok:`, `${embeddings.length} embeddings, ${embeddings[0].length} dims`)
			print(`[${i + 1}] usage:`, usage)
		} catch (e) {
			print(`[${i + 1}] fail:`, (e as Error).message)
		}
	}
})
