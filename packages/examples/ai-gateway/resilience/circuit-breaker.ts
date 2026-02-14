import { gateway } from "@ai-sdk/gateway"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../lib/chaos"
import { print } from "../../lib/print"
import { run } from "../../lib/run"

run(async () => {
  const model = cruelModel(gateway("openai/gpt-4o"), {
    rateLimit: 0.5,
    overloaded: 0.2,
    onChaos: log,
  })

  let failures = 0
  const threshold = 3
  let circuitOpen = false

  for (let i = 0; i < 15; i++) {
    if (circuitOpen) {
      console.log(`[${i + 1}] circuit open, skipping`)
      continue
    }

    try {
      const result = await generateText({
        model,
        prompt: `Request ${i + 1}: Say hi.`,
      })
      failures = 0
      print(`[${i + 1}] ok:`, result.text.slice(0, 40))
    } catch {
      failures++
      console.log(`[${i + 1}] failed (${failures}/${threshold})`)
      if (failures >= threshold) {
        circuitOpen = true
        console.log("circuit breaker opened")
        setTimeout(() => {
          circuitOpen = false
          failures = 0
          console.log("circuit breaker closed")
        }, 3000)
      }
    }
  }
})
