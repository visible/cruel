import { gateway } from "@ai-sdk/gateway"
import { Output, generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { z } from "zod"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
  const model = cruelModel(gateway("openai/gpt-4o"), {
    partialResponse: 0.3,
    delay: [200, 800],
    onChaos: log,
  })

  const result = await generateText({
    model,
    output: Output.object({
      schema: z.object({
        movie: z.object({
          title: z.string(),
          year: z.number(),
          director: z.string(),
          genres: z.array(z.string()),
        }),
      }),
    }),
    prompt: "Give me details about the movie Interstellar.",
  })

  print("output:", result.output)
  print("usage:", result.usage)
})
