import { gateway } from "@ai-sdk/gateway"
import { streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import * as diag from "../../../lib/diagnostics"
import { run } from "../../../lib/run"

run(async () => {
	const ctx = diag.context()
	const model = cruelModel(gateway("cerebras/llama3.1-8b"), {
		rateLimit: 0.2,
		overloaded: 0.1,
		delay: [200, 1000],
		slowTokens: [50, 300],
		streamCut: 0.15,
		corruptChunks: 0.05,
		partialResponse: 0.1,
		fail: 0.05,
		onChaos: diag.tracker(ctx),
	})

	for (let i = 1; i <= 10; i++) {
		diag.before(ctx, i)
		const start = performance.now()
		try {
			const result = streamText({
				model,
				prompt: `Request ${i}: Write a haiku.`,
			})
			const text = await result.text
			diag.success(ctx, i, Math.round(performance.now() - start), text)
		} catch (e) {
			diag.failure(ctx, i, Math.round(performance.now() - start), e)
		}
	}

	diag.report(ctx)
})
