import { openai } from "@ai-sdk/openai"
import { generateText, stepCountIs, tool } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { z } from "zod"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
  const model = cruelModel(openai("gpt-4o"), {
    rateLimit: 0.1,
    toolFailure: 0.2,
    onChaos: log,
  })

  const result = await generateText({
    model,
    tools: {
      calculate: tool({
        description: "Evaluate a math expression",
        inputSchema: z.object({ expression: z.string() }),
        execute: async ({ expression }) => String(Number(expression)),
      }),
    },
    stopWhen: stepCountIs(5),
    prompt: "What is 42 * 17 + 3?",
  })

  print("text:", result.text)
  print("steps:", result.steps.length)
})
