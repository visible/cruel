import { openai } from "@ai-sdk/openai"
import { experimental_generateSpeech as generateSpeech } from "ai"
import { cruelSpeechModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
	const model = cruelSpeechModel(openai.speech("tts-1"), {
		rateLimit: 0.4,
		overloaded: 0.2,
		delay: [500, 3000],
		fail: 0.15,
		onChaos: log,
	})

	for (let i = 0; i < 8; i++) {
		try {
			const result = await generateSpeech({
				model,
				text: `Request ${i + 1}: Testing speech under chaos.`,
			})
			print(`[${i + 1}] ok:`, `${result.audio.uint8Array.length} bytes`)
		} catch (e) {
			print(`[${i + 1}] fail:`, (e as Error).message)
		}
	}
})
