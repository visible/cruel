```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ▄████▄  ██▀███  █    ██ ▓█████  ██▓                        │
│  ▒██▀ ▀█ ▓██ ▒ ██▒██  ▓██▒▓█   ▀ ▓██▒                        │
│  ▒▓█    ▄▓██ ░▄█ ▓██  ▒██░▒███   ▒██░                        │
│  ▒▓▓▄ ▄██▒██▀▀█▄ ▓▓█  ░██░▒▓█  ▄ ▒██░                        │
│  ▒ ▓███▀ ░██▓ ▒██▒▒█████▓ ░▒████▒░██████▒                    │
│  ░ ░▒ ▒  ░ ▒▓ ░▒▓░▒▓▒ ▒ ▒ ░░ ▒░ ░░ ▒░▓  ░                    │
│                                                              │
│   chaos testing with zero mercy                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

```bash
> what is this?

  a chaos engineering library for testing resilience
  inject failures, latency, timeouts into any function
  works with fetch, ai sdks, databases, anything async

> install?

  bun add cruel
  npm install cruel
  pnpm add cruel

> quick start?

  import { cruel } from "cruel"

  const api = cruel(fetch, {
    fail: 0.1,
    delay: [100, 500],
    timeout: 0.05,
  })

  const res = await api("https://api.example.com")

> shorthand helpers?

  cruel.fail(fn, 0.1)      // 10% failures
  cruel.slow(fn, 500)      // add 500ms delay
  cruel.timeout(fn, 0.1)   // 10% never resolve
  cruel.flaky(fn)          // random chaos
  cruel.unreliable(fn)     // more chaos
  cruel.nightmare(fn)      // maximum chaos

> network chaos?

  cruel.network.latency(fn, [100, 500])
  cruel.network.packetLoss(fn, 0.1)
  cruel.network.disconnect(fn, 0.05)
  cruel.network.dns(fn, 0.02)
  cruel.network.slow(fn)
  cruel.network.unstable(fn)
  cruel.network.offline(fn)

> http chaos?

  cruel.http.status(fn, 500, 0.1)
  cruel.http.status(fn, [500, 502, 503])
  cruel.http.rateLimit(fn, 0.1)
  cruel.http.serverError(fn, 0.1)
  cruel.http.clientError(fn, 0.1)
  cruel.http.badGateway(fn)
  cruel.http.serviceUnavailable(fn)
  cruel.http.gatewayTimeout(fn)

> stream chaos?

  cruel.stream.cut(fn, 0.1)
  cruel.stream.pause(fn, 500)
  cruel.stream.corrupt(fn, 0.1)
  cruel.stream.truncate(fn, 0.1)
  cruel.stream.slow(fn)
  cruel.stream.flaky(fn)

> ai chaos?

  cruel.ai.rateLimit(fn, 0.1)
  cruel.ai.overloaded(fn, 0.05)
  cruel.ai.contextLength(fn, 0.02)
  cruel.ai.contentFilter(fn, 0.01)
  cruel.ai.modelUnavailable(fn)
  cruel.ai.slowTokens(fn, [50, 200])
  cruel.ai.streamCut(fn, 0.1)
  cruel.ai.partialResponse(fn, 0.1)
  cruel.ai.invalidJson(fn, 0.05)
  cruel.ai.realistic(fn)
  cruel.ai.nightmare(fn)

> ai sdk v6 integration?

  import { cruelModel, cruelProvider, presets } from "cruel/ai-sdk"
  import { generateText, streamText } from "ai"
  import { openai } from "@ai-sdk/openai"

  // wrap entire provider
  const chaosOpenAI = cruelProvider(openai, {
    rateLimit: 0.1,
    overloaded: 0.05,
    delay: [100, 500],
  })

  // use with generateText
  const result = await generateText({
    model: chaosOpenAI("gpt-4o"),
    prompt: "hello",
  })

  // or wrap individual model
  const model = cruelModel(openai("gpt-4o"), presets.realistic)

  // streaming with chaos
  const { textStream } = await streamText({
    model: cruelModel(openai("gpt-4o"), {
      streamCut: 0.1,
      slowTokens: [50, 200],
    }),
    prompt: "hello",
  })

> ai sdk middleware?

  import { cruelMiddleware } from "cruel/ai-sdk"
  import { wrapLanguageModel } from "ai"
  import { openai } from "@ai-sdk/openai"

  // create chaos middleware
  const middleware = cruelMiddleware({
    rateLimit: 0.1,
    overloaded: 0.05,
    streamCut: 0.1,
  })

  // wrap model with middleware
  const model = wrapLanguageModel({
    model: openai("gpt-4o"),
    middleware,
  })

> ai sdk presets?

  import { presets } from "cruel/ai-sdk"

  presets.realistic    // light, production-like
  presets.unstable     // medium chaos
  presets.harsh        // aggressive chaos
  presets.nightmare    // extreme chaos
  presets.apocalypse   // everything fails

> ai sdk errors?

  import { CruelAPIError } from "cruel/ai-sdk"
  import { APICallError } from "ai"

  try {
    await generateText({ model, prompt })
  } catch (e) {
    if (APICallError.isInstance(e)) {
      console.log("status:", e.statusCode)
      console.log("retryable:", e.isRetryable)
    }
  }

> wrap ai tools?

  import { cruelTools } from "cruel/ai-sdk"

  const tools = cruelTools({
    search: { execute: searchFn },
    calculate: { execute: calcFn },
  }, {
    toolFailure: 0.1,
    toolTimeout: 0.05,
    delay: [50, 200],
  })

> examples model override?

  cd packages/examples
  bun run run.ts ai-sdk openai -m gpt-6
  bun run run.ts ai-gateway openai --model gpt-6
  // this sets MODEL for each matched example process

> circuit breaker?

  const api = cruel.circuitBreaker(fetch, {
    threshold: 5,     // open after 5 failures
    timeout: 30000,   // try again after 30s
    onOpen: () => console.log("circuit opened"),
    onClose: () => console.log("circuit closed"),
  })

  await api("...")
  api.getState() // { state: "closed", failures: 0 }

> retry with backoff?

  const api = cruel.retry(fetch, {
    attempts: 3,
    delay: 1000,
    backoff: "exponential",  // fixed, linear, exponential
    maxDelay: 10000,
    onRetry: (attempt, error) => console.log(`retry ${attempt}`),
    retryIf: (error) => error.status !== 404,
  })

> bulkhead?

  const api = cruel.bulkhead(fetch, {
    maxConcurrent: 10,   // max parallel requests
    maxQueue: 100,       // max queued requests
    onReject: () => console.log("rejected"),
  })

> timeout wrapper?

  const api = cruel.withTimeout(fetch, {
    ms: 5000,
    onTimeout: () => console.log("timed out"),
  })

> fallback?

  const api = cruel.fallback(fetch, {
    fallback: cachedData,  // or () => fetchBackup()
    onFallback: (error) => console.log("using fallback"),
  })

> combine patterns?

  import { cruel } from "cruel"

  // chaos + circuit breaker + retry
  const resilientApi = cruel.retry(
    cruel.circuitBreaker(
      cruel(fetch, { fail: 0.1, delay: [100, 500] }),
      { threshold: 5, timeout: 30000 }
    ),
    { attempts: 3, backoff: "exponential" }
  )

> presets?

  cruel.enable(cruel.presets.development)
  cruel.enable(cruel.presets.staging)
  cruel.enable(cruel.presets.production)
  cruel.enable(cruel.presets.harsh)
  cruel.enable(cruel.presets.nightmare)
  cruel.enable(cruel.presets.apocalypse)

> global mode?

  cruel.enable({ fail: 0.1, delay: [100, 500] })
  cruel.disable()
  cruel.toggle()
  cruel.isEnabled()

> scoped chaos?

  await cruel.scope(async () => {
    await api("...")
  }, { fail: 0.2 })

> scenarios?

  cruel.scenario("outage", {
    chaos: { fail: 1 },
    duration: 5000,
  })

  await cruel.play("outage")
  cruel.stop()

  // built-in scenarios
  await cruel.play("networkPartition")
  await cruel.play("highLatency")
  await cruel.play("degraded")
  await cruel.play("recovery")

> intercept fetch?

  cruel.patchFetch()

  cruel.intercept("api.openai.com", {
    rateLimit: { rate: 0.1, retryAfter: 60 },
    delay: [100, 500],
  })

  cruel.intercept(/api\.anthropic\.com/, {
    fail: 0.1,
    status: [529],
  })

  cruel.unpatchFetch()

> profiles?

  cruel.profile("testing", { fail: 0.2, delay: 100 })
  cruel.useProfile("testing")

> stats?

  cruel.stats()
  // { calls, failures, timeouts, delays, ... }
  cruel.resetStats()

> deterministic?

  cruel.seed(12345)
  cruel.coin(0.5) // same result every time

> utilities?

  cruel.coin(0.5)
  cruel.pick([1, 2, 3])
  cruel.between(10, 100)
  cruel.maybe(value, 0.5)
  await cruel.delay(500)

> fluent api?

  cruel.wrap(fn).fail(0.1)
  cruel.wrap(fn).slow(500)
  cruel.wrap(fn).timeout(0.05)
  cruel.wrap(fn).flaky()
  cruel.wrap(fn).nightmare()

> factory?

  import { createCruel } from "cruel"

  const myCruel = createCruel({ delay: 100 })

> errors?

  import {
    CruelError,
    CruelTimeoutError,
    CruelNetworkError,
    CruelHttpError,
    CruelRateLimitError,
    CruelAIError,
  } from "cruel"

> cli?

  cruel test https://api.example.com --fail 0.1 --count 20
  cruel test https://api.example.com --preset nightmare
  cruel scenario outage --duration 5000
  cruel presets

> testing?

  import { describe, test, beforeEach } from "bun:test"
  import { cruel } from "cruel"

  beforeEach(() => {
    cruel.reset()
    cruel.seed(12345)
  })

  test("handles failures", async () => {
    cruel.enable({ fail: 1 })
    await expect(api()).rejects.toThrow()
  })

> docs?

  https://cruel.dev/docs

> features?

  ✓ chaos injection
  ✓ network simulation
  ✓ http status codes
  ✓ stream manipulation
  ✓ ai sdk v6 integration
  ✓ middleware support
  ✓ circuit breaker
  ✓ retry with backoff
  ✓ bulkhead isolation
  ✓ timeout wrapper
  ✓ fallback support
  ✓ fetch interception
  ✓ presets and profiles
  ✓ scenarios
  ✓ statistics
  ✓ deterministic mode
  ✓ cli tool
  ✓ typescript native
  ✓ zero dependencies
  ✓ works everywhere

> license?

  mit
```
