import { vertex } from "@ai-sdk/google-vertex"
import { experimental_generateVideo as generateVideo } from "ai"
import { cruelVideoModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelVideoModel(vertex.video("veo-2.0-generate-001"), {
		rateLimit: 0.2,
		delay: [500, 2000],
		onChaos: log,
	})

	const result = await generateVideo({
		model,
		prompt: "A cat walking across a sunlit room",
	})

	print("videos:", result.videos.length)
})
