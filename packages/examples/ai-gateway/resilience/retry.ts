import { gateway } from "@ai-sdk/gateway"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../lib/chaos"
import { print } from "../../lib/print"
import { run } from "../../lib/run"

run(async () => {
  const model = cruelModel(gateway("anthropic/claude-sonnet-4-5-20250929"), {
    rateLimit: { rate: 0.5, retryAfter: 2 },
    overloaded: 0.3,
    onChaos: log,
  })

  const result = await generateText({
    model,
    prompt: "Hello world",
    maxRetries: 3,
  })

  print("text:", result.text)
})
