import { assemblyai } from "@ai-sdk/assemblyai"
import { experimental_transcribe as transcribe } from "ai"
import { cruelTranscriptionModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelTranscriptionModel(assemblyai.transcription("best"), {
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
