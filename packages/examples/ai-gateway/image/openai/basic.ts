import { gateway } from "@ai-sdk/gateway"
import { generateImage } from "ai"
import { cruelImageModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelImageModel(gateway.imageModel("openai/dall-e-3"), {
		rateLimit: 0.2,
		delay: [500, 2000],
		onChaos: log,
	})

	const result = await generateImage({
		model,
		prompt: "A serene mountain landscape at sunset",
	})

	print("images:", result.images.length)
})
