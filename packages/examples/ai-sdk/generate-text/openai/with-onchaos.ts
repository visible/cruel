import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import type { ChaosEvent } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
  const events: ChaosEvent[] = []

  const model = cruelModel(openai("gpt-4o"), {
    rateLimit: 0.2,
    delay: [100, 500],
    partialResponse: 0.3,
    onChaos: (event) => {
      log(event)
      events.push(event)
    },
  })

  const result = await generateText({
    model,
    prompt: "Invent a new holiday and describe its traditions.",
  })

  print("text:", result.text)
  print("chaos events:", events)
})
