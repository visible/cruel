import { gateway } from "@ai-sdk/gateway"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../lib/chaos"
import { print } from "../../lib/print"
import { run } from "../../lib/run"

run(async () => {
  const providers = [
    "openai/gpt-4o",
    "anthropic/claude-sonnet-4-5-20250929",
    "google/gemini-2.5-flash",
  ]

  for (let i = 0; i < 9; i++) {
    const id = providers[i % providers.length]
    const model = cruelModel(gateway(id), {
      rateLimit: 0.2,
      delay: [50, 300],
      onChaos: log,
    })

    try {
      const result = await generateText({
        model,
        prompt: `Request ${i + 1}: Name a fruit.`,
        maxRetries: 1,
      })
      print(`[${i + 1}] ${id}:`, result.text.slice(0, 60))
    } catch (e) {
      print(`[${i + 1}] ${id} failed:`, (e as Error).message)
    }
  }
})
