import { gateway } from "@ai-sdk/gateway"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
  const models = [
    gateway("openai/gpt-4o"),
    gateway("anthropic/claude-sonnet-4-5-20250929"),
    gateway("google/gemini-2.5-flash"),
  ]

  const prompt = "What is the speed of light?"

  for (const base of models) {
    const model = cruelModel(base, {
      rateLimit: 0.2,
      delay: [100, 500],
      onChaos: log,
    })

    try {
      const start = Date.now()
      const result = await generateText({ model, prompt, maxRetries: 2 })
      print(`${base.modelId} (${Date.now() - start}ms):`, result.text.slice(0, 100))
    } catch (e) {
      print(`${base.modelId} failed:`, (e as Error).message)
    }
  }
})
