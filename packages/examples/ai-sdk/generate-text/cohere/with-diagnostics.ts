import { cohere } from "@ai-sdk/cohere"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import * as diag from "../../../lib/diagnostics"
import { run } from "../../../lib/run"

run(async () => {
	const ctx = diag.context()
	const model = cruelModel(cohere("command-r-plus"), {
		rateLimit: 0.3,
		overloaded: 0.15,
		contextLength: 0.05,
		contentFilter: 0.05,
		modelUnavailable: 0.1,
		emptyResponse: 0.05,
		partialResponse: 0.2,
		delay: [200, 1500],
		fail: 0.1,
		timeout: 0.02,
		onChaos: diag.tracker(ctx),
	})

	for (let i = 1; i <= 15; i++) {
		diag.before(ctx, i)
		const start = performance.now()
		try {
			const result = await generateText({
				model,
				prompt: `Request ${i}: Tell me a fact.`,
				maxRetries: 2,
			})
			diag.success(ctx, i, Math.round(performance.now() - start), result.text)
		} catch (e) {
			diag.failure(ctx, i, Math.round(performance.now() - start), e)
		}
	}

	diag.report(ctx)
})
