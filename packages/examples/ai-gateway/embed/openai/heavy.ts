import { gateway } from "@ai-sdk/gateway"
import { embedMany } from "ai"
import { cruelEmbeddingModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelEmbeddingModel(gateway.embeddingModel("openai/text-embedding-3-small"), {
		rateLimit: 0.4,
		overloaded: 0.2,
		delay: [200, 1000],
		fail: 0.15,
		onChaos: log,
	})

	for (let i = 0; i < 10; i++) {
		try {
			const { embeddings, usage } = await embedMany({
				model,
				values: [`batch ${i + 1} a`, `batch ${i + 1} b`, `batch ${i + 1} c`],
			})
			print(`[${i + 1}] ok:`, `${embeddings.length} embeddings, ${embeddings[0].length} dims`)
		} catch (e) {
			print(`[${i + 1}] fail:`, (e as Error).message)
		}
	}
})
