# adding examples

examples live in `packages/examples/` and are split into two categories:

- `ai-sdk/` - direct provider usage (`@ai-sdk/openai`, `@ai-sdk/anthropic`, etc.)
- `ai-gateway/` - vercel ai gateway (`@ai-sdk/gateway`)

## structure

examples are organized by function, then by provider:

```
packages/examples/
├── ai-sdk/
│   ├── generate-text/
│   │   ├── openai/
│   │   │   ├── basic.ts
│   │   │   ├── heavy.ts
│   │   │   ├── with-tools.ts
│   │   │   ├── with-output.ts
│   │   │   ├── with-websearch.ts
│   │   │   └── multi-turn.ts
│   │   ├── anthropic/
│   │   │   ├── basic.ts
│   │   │   ├── heavy.ts
│   │   │   ├── with-tools.ts
│   │   │   └── ...
│   │   ├── google/
│   │   ├── mistral/
│   │   ├── groq/
│   │   ├── deepseek/
│   │   ├── xai/
│   │   ├── cohere/
│   │   └── perplexity/
│   ├── stream-text/
│   │   └── (same provider folders)
│   ├── embed/
│   │   ├── openai/
│   │   ├── google/
│   │   └── cohere/
│   ├── image/
│   ├── speech/
│   └── transcription/
├── ai-gateway/
│   ├── generate-text/
│   │   ├── openai/
│   │   ├── anthropic/
│   │   ├── google/
│   │   ├── mistral/
│   │   ├── xai/
│   │   └── deepseek/
│   ├── stream-text/
│   ├── embed/
│   ├── chaos/
│   ├── resilience/
│   └── multi-provider/
├── lib/
│   ├── chaos.ts
│   ├── print.ts
│   └── run.ts
└── run.ts              # example runner
```

## example types

every provider folder should have at minimum:

| file             | purpose                                           |
| ---------------- | ------------------------------------------------- |
| `basic.ts`       | simplest possible usage with one chaos option      |
| `heavy.ts`       | all chaos options cranked up, runs multiple iterations |
| `with-tools.ts`  | tool calling with chaos on both model and tools    |
| `with-output.ts` | structured output with `Output.object`             |
| `multi-turn.ts`  | multi-step tool usage with `stopWhen: stepCountIs` |

provider-specific examples:

| file                | provider | purpose                    |
| ------------------- | -------- | -------------------------- |
| `with-websearch.ts` | openai   | web search tool            |
| `with-filesearch.ts`| openai   | file search tool           |
| `with-grounding.ts` | google   | google search grounding    |

## template

```ts
import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import { cruelModel } from "cruel/ai-sdk"
import { log } from "../../../lib/chaos"
import { print } from "../../../lib/print"
import { run } from "../../../lib/run"

run(async () => {
  const model = cruelModel(anthropic("claude-sonnet-4-5-20250929"), {
    rateLimit: 0.2,
    delay: [100, 500],
    onChaos: log,
  })

  const result = await generateText({
    model,
    prompt: "Your prompt here.",
  })

  print("text:", result.text)
})
```

## ai sdk v6 patterns

these examples must follow ai sdk v6:

- use `inputSchema` in `tool()` (not `parameters`)
- use `stopWhen: stepCountIs(N)` (not `maxSteps`)
- use `generateText` with `Output.object` for structured output (not `generateObject`)
- use `streamText` with `Output.object` for streaming objects (not `streamObject`)
- use `provider.embedding()` (not `provider.textEmbeddingModel()`)

## guidelines

- one file per example
- use `run()` wrapper from `../../../lib/run`
- use `log` from `../../../lib/chaos` for `onChaos`
- use `print()` from `../../../lib/print` for output
- keep prompts short
- show at least one chaos option
- tab indentation, double quotes

## adding a new provider

to add examples for a new provider (e.g. openrouter):

1. create provider folders under each function:
   - `ai-sdk/generate-text/openrouter/`
   - `ai-sdk/stream-text/openrouter/`
2. add at least `basic.ts` and `heavy.ts` in each
3. add the provider dependency to `packages/examples/package.json`
4. add a runner script: `"examples:openrouter": "bun run run.ts openrouter"`

## running examples

```bash
cd packages/examples

bun run examples:anthropic     # all anthropic examples
bun run examples:openai        # all openai examples
bun run examples:heavy         # all stress tests
bun run examples:ai-gateway    # all gateway examples

bun run run.ts google          # custom filter
bun run run.ts stream-text     # all stream-text examples
bun run run.ts with-tools      # all tool examples
```
