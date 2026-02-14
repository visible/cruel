import { gateway } from "@ai-sdk/gateway"
import { Output, streamText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { z } from "zod"
import { log } from "../../../lib/chaos"
import { run } from "../../../lib/run"

run(async () => {
  const model = cruelModel(gateway("openai/gpt-4o"), {
    slowTokens: [50, 200],
    corruptChunks: 0.02,
    onChaos: log,
  })

  const result = streamText({
    model,
    output: Output.array({
      element: z.object({
        name: z.string(),
        symbol: z.string(),
        number: z.number(),
      }),
    }),
    prompt: "List 10 chemical elements with their symbols and atomic numbers.",
  })

  for await (const element of result.elementStream) {
    console.log("element:", element)
  }
})
