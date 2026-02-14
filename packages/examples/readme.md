# examples

```bash
bun install
```

## run

```bash
# single example
bun run ai-sdk/generate-text/openai/basic.ts

# by provider
bun run run.ts ai-sdk openai
bun run run.ts ai-gateway anthropic

# scoped
bun run run.ts ai-gateway openai basic
bun run run.ts ai-sdk stream-text groq

# by type
bun run run.ts heavy
bun run run.ts with-tools
bun run run.ts with-diagnostics
```

## structure

```
ai-sdk/                    direct provider examples
  generate-text/
    openai/
      basic.ts             simplest usage
      heavy.ts             all chaos options maxed
      with-tools.ts        tool calling under chaos
      with-output.ts       structured output
      with-diagnostics.ts  full chaos report
      multi-turn.ts        multi-step tool usage
    anthropic/
    google/
    ...
  stream-text/
  embed/
  image/
  speech/
  transcription/

ai-gateway/                vercel ai gateway examples
  generate-text/
  stream-text/
  embed/
  image/
  reasoning/
  tools/
  failover/
  chaos/
  resilience/
  multi-provider/

lib/                       shared utilities
  chaos.ts                 onChaos event logger
  colors.ts                ansi color constants
  diagnostics.ts           full chaos report generator
  print.ts                 formatted output
  run.ts                   dotenv + error handler
```
