import { alibaba } from "@ai-sdk/alibaba"
import { experimental_generateVideo as generateVideo } from "ai"
import { cruelVideoModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelVideoModel(alibaba.video("wan-v2.1-t2v"), {
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
