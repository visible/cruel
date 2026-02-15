import { vertex } from "@ai-sdk/google-vertex"
import { experimental_generateVideo as generateVideo } from "ai"
import { cruelVideoModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelVideoModel(vertex.video("veo-2.0-generate-001"), {
		rateLimit: 0.4,
		overloaded: 0.2,
		delay: [1000, 5000],
		fail: 0.15,
		onChaos: log,
	})

	for (let i = 0; i < 3; i++) {
		try {
			const result = await generateVideo({
				model,
				prompt: `Request ${i + 1}: A landscape timelapse`,
			})
			print(`[${i + 1}] ok:`, `${result.videos.length} videos`)
		} catch (e) {
			print(`[${i + 1}] fail:`, (e as Error).message)
		}
	}
})
