import { anthropic } from "@ai-sdk/anthropic"
import { generateImage } from "ai"
import { cruelImageModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelImageModel(anthropic.image("anthropic-image"), {
		rateLimit: 0.4,
		overloaded: 0.2,
		delay: [1000, 5000],
		fail: 0.15,
		onChaos: log,
	})

	for (let i = 0; i < 5; i++) {
		try {
			const result = await generateImage({
				model,
				prompt: `Request ${i + 1}: A landscape painting`,
			})
			print(`[${i + 1}] ok:`, `${result.images.length} images`)
		} catch (e) {
			print(`[${i + 1}] fail:`, (e as Error).message)
		}
	}
})
