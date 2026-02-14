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
  ] as const

  const prompt = "Explain recursion in one sentence."

  const results = await Promise.allSettled(
    providers.map(async (id) => {
      const model = cruelModel(gateway(id), {
        delay: [100, 800],
        rateLimit: 0.15,
        onChaos: log,
      })
      const start = Date.now()
      const result = await generateText({ model, prompt, maxRetries: 2 })
      return { id, text: result.text, ms: Date.now() - start }
    })
  )

  for (const r of results) {
    if (r.status === "fulfilled") {
      print(`${r.value.id} (${r.value.ms}ms):`, r.value.text.slice(0, 100))
    } else {
      print("failed:", r.reason.message)
    }
  }
})
