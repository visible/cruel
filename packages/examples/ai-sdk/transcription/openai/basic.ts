import { openai } from "@ai-sdk/openai"
import { experimental_transcribe as transcribe } from "ai"
import { cruelTranscriptionModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelTranscriptionModel(openai.transcription("whisper-1"), {
		rateLimit: 0.1,
		delay: [100, 500],
		onChaos: log,
	})

	const result = await transcribe({
		model,
		audio: new Uint8Array(1024),
		mediaType: "audio/wav",
	})

	print("text:", result.text)
})
