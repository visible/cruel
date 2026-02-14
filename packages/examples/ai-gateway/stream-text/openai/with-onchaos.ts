import { gateway } from "@ai-sdk/gateway"
import { streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import type { ChaosEvent } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
  const events: ChaosEvent[] = []

  const model = cruelModel(gateway("google/gemini-2.5-flash"), {
    slowTokens: [20, 100],
    streamCut: 0.1,
    onChaos: (event) => {
      log(event)
      events.push(event)
    },
  })

  const result = streamText({
    model,
    prompt: "Explain how DNS works in simple terms.",
  })

  for await (const chunk of result.fullStream) {
    if (chunk.type === "text-delta") {
      process.stdout.write(chunk.text)
    }
    if (chunk.type === "error") {
      console.error("\nstream error:", chunk.error)
    }
  }

  console.log()
  print("chaos events:", events)
})
