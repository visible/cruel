import { elevenlabs } from "@ai-sdk/elevenlabs"
import { generateSpeech } from "ai"
import { cruelSpeechModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelSpeechModel(elevenlabs.speech("eleven_multilingual_v2"), {
		rateLimit: 0.1,
		delay: [100, 500],
		onChaos: log,
	})

	const result = await generateSpeech({
		model,
		text: "Hello, this is a test of chaos engineering for speech synthesis.",
	})

	print("audio length:", result.audio.length)
})
