import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../lib/chaos"
import { run } from "../../lib/run"

run(async () => {
  const model = cruelModel(openai("gpt-4o"), {
    rateLimit: { rate: 0.8, retryAfter: 5 },
    onChaos: log,
  })

  const results = await Promise.allSettled(
    Array.from({ length: 20 }, (_, i) =>
      generateText({
        model,
        prompt: `Request ${i + 1}`,
        maxRetries: 3,
      })
    )
  )

  const succeeded = results.filter((r) => r.status === "fulfilled").length
  const failed = results.filter((r) => r.status === "rejected").length

  console.log(`succeeded: ${succeeded}/${results.length}`)
  console.log(`failed: ${failed}/${results.length}`)
})
