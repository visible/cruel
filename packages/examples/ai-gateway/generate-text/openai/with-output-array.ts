import { gateway } from "@ai-sdk/gateway"
import { Output, generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { z } from "zod"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
  const model = cruelModel(gateway("openai/gpt-4o"), {
    rateLimit: 0.2,
    partialResponse: 0.15,
    delay: [100, 400],
    onChaos: log,
  })

  const result = await generateText({
    model,
    output: Output.array({
      element: z.object({
        country: z.string(),
        capital: z.string(),
        population: z.number(),
      }),
    }),
    prompt: "List 5 European countries with their capitals and populations.",
  })

  print("countries:", result.output)
  print("usage:", result.usage)
})
