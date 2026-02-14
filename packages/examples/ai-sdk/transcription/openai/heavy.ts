import { openai } from "@ai-sdk/openai"
import { experimental_transcribe as transcribe } from "ai"
import { cruelTranscriptionModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelTranscriptionModel(openai.transcription("whisper-1"), {
		rateLimit: 0.4,
		overloaded: 0.2,
		delay: [500, 2000],
		fail: 0.15,
		onChaos: log,
	})

	for (let i = 0; i < 5; i++) {
		try {
			const result = await transcribe({
				model,
				audio: new Uint8Array(1024),
			})
			print(`[${i + 1}] ok:`, result.text)
		} catch (e) {
			print(`[${i + 1}] fail:`, (e as Error).message)
		}
	}
})
