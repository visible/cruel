import { openai } from "@ai-sdk/openai"
import { generateText, wrapLanguageModel } from "ai"
import { cruelMiddleware } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
  const model = wrapLanguageModel({
    model: openai("gpt-4o"),
    middleware: cruelMiddleware({
      rateLimit: { rate: 0.5, retryAfter: 2 },
      overloaded: 0.3,
      onChaos: log,
    }),
  })

  const result = await generateText({
    model,
    prompt: "Hello world",
    maxRetries: 3,
  })

  print("text:", result.text)
})
