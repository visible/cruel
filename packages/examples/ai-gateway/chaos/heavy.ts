import { gateway } from "@ai-sdk/gateway"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../lib/chaos"
import { print } from "../../lib/print"
import { run } from "../../lib/run"

run(async () => {
  const model = cruelModel(gateway("openai/gpt-5.2-chat"), {
    rateLimit: 0.4,
    overloaded: 0.3,
    delay: [500, 3000],
    streamCut: 0.15,
    slowTokens: [100, 500],
    partialResponse: 0.2,
    onChaos: log,
  })

  for (let i = 0; i < 5; i++) {
    try {
      const result = await generateText({
        model,
        prompt: `Request ${i + 1}: Explain chaos engineering.`,
        maxRetries: 2,
      })
      print(`[${i + 1}] success:`, result.text.slice(0, 80))
    } catch (e) {
      print(`[${i + 1}] error:`, (e as Error).message)
    }
  }
})
