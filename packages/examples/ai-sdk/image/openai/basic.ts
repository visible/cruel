import { openai } from "@ai-sdk/openai"
import { generateImage } from "ai"
import { cruelImageModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelImageModel(openai.image("dall-e-3"), {
		rateLimit: 0.2,
		delay: [500, 2000],
		onChaos: log,
	})

	const result = await generateImage({
		model,
		prompt: "A cat wearing a top hat",
	})

	print("images:", result.images.length)
})
