import { gateway } from "@ai-sdk/gateway"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../lib/chaos"
import { print } from "../../lib/print"
import { run } from "../../lib/run"

run(async () => {
  const primary = cruelModel(gateway("google/gemini-2.5-flash"), {
    rateLimit: 1,
    onChaos: log,
  })

  const fallback = gateway("anthropic/claude-haiku-4.5")

  try {
    const result = await generateText({
      model: primary,
      prompt: "how many r's in strawberry?",
    })
    print("primary:", result.text)
  } catch {
    console.log("google failed, falling back to anthropic...")
    const result = await generateText({
      model: fallback,
      prompt: "how many r's in strawberry?",
    })
    print("fallback:", result.text)
  }
})






