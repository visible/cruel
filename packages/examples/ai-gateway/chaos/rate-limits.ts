import { gateway } from "@ai-sdk/gateway"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../lib/chaos"
import { print } from "../../lib/print"
import { run } from "../../lib/run"

run(async () => {
  const model = cruelModel(gateway("openai/gpt-4o"), {
    rateLimit: { rate: 0.6, retryAfter: 3 },
    onChaos: log,
  })

  const results = await Promise.allSettled(
    Array.from({ length: 10 }, (_, i) =>
      generateText({
        model,
        prompt: `Request ${i + 1}: Name a planet.`,
        maxRetries: 2,
      })
    )
  )

  const succeeded = results.filter((r) => r.status === "fulfilled").length
  const failed = results.filter((r) => r.status === "rejected").length

  console.log(`succeeded: ${succeeded}/${results.length}`)
  console.log(`failed: ${failed}/${results.length}`)
})
