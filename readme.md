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

> quick start?

  import { cruel } from "cruel"

  // wrap any function
  const api = cruel(fetch, {
    fail: 0.1,           // 10% failure rate
    delay: [100, 500],   // random latency
    timeout: 0.05,       // 5% hang forever
  })

  // use normally
  const res = await api("https://api.example.com")

> shorthand helpers?

  cruel.fail(fn, 0.1)      // 10% failures
  cruel.slow(fn, 500)      // add 500ms delay
  cruel.timeout(fn, 0.1)   // 10% never resolve
  cruel.flaky(fn)          // random chaos
  cruel.unreliable(fn)     // more chaos
  cruel.nightmare(fn)      // maximum chaos

> network chaos?

  cruel.network.latency(fn, [100, 500])  // add latency
  cruel.network.packetLoss(fn, 0.1)      // 10% packet loss
  cruel.network.disconnect(fn, 0.05)    // random disconnects
  cruel.network.dns(fn, 0.02)           // dns failures
  cruel.network.slow(fn)                // slow network
  cruel.network.unstable(fn)            // unstable connection
  cruel.network.offline(fn)             // always fail

> http chaos?

  cruel.http.status(fn, 500, 0.1)       // 10% return 500
  cruel.http.status(fn, [500, 502, 503]) // random 5xx
  cruel.http.rateLimit(fn, 0.1)         // 10% rate limit
  cruel.http.serverError(fn, 0.1)       // random server error
  cruel.http.clientError(fn, 0.1)       // random client error
  cruel.http.badGateway(fn)             // 502 errors
  cruel.http.serviceUnavailable(fn)     // 503 errors
  cruel.http.gatewayTimeout(fn)         // 504 errors

> stream chaos?

  cruel.stream.cut(fn, 0.1)       // cut stream mid-transfer
  cruel.stream.pause(fn, 500)     // pause mid-stream
  cruel.stream.corrupt(fn, 0.1)   // corrupt data
  cruel.stream.truncate(fn, 0.1)  // truncate response
  cruel.stream.slow(fn)           // slow streaming
  cruel.stream.flaky(fn)          // unreliable stream

> ai sdk chaos?

  cruel.ai.rateLimit(fn, 0.1)        // 429 rate limits
  cruel.ai.overloaded(fn, 0.05)      // model overloaded
  cruel.ai.contextLength(fn, 0.02)   // context exceeded
  cruel.ai.contentFilter(fn, 0.01)   // content filtered
  cruel.ai.modelUnavailable(fn)      // model not available
  cruel.ai.slowTokens(fn, [50, 200]) // slow generation
  cruel.ai.streamCut(fn, 0.1)        // stream dies mid-response
  cruel.ai.partialResponse(fn, 0.1)  // incomplete response
  cruel.ai.invalidJson(fn, 0.05)     // malformed json
  cruel.ai.realistic(fn)             // realistic ai chaos
  cruel.ai.nightmare(fn)             // maximum ai chaos

> with ai sdk?

  import { cruel } from "cruel"
  import { generateText } from "ai"
  import { openai } from "@ai-sdk/openai"

  const generate = cruel.ai.realistic(async (prompt) => {
    return generateText({
      model: openai("gpt-4"),
      prompt,
    })
  })

  // handles rate limits, timeouts, slow responses
  const result = await generate("hello")

> presets?

  cruel.enable(cruel.presets.development)  // light chaos
  cruel.enable(cruel.presets.staging)      // medium chaos
  cruel.enable(cruel.presets.production)   // production-like
  cruel.enable(cruel.presets.harsh)        // harsh conditions
  cruel.enable(cruel.presets.nightmare)    // nightmare mode
  cruel.enable(cruel.presets.apocalypse)   // everything fails

> global mode?

  // enable chaos globally
  cruel.enable({ fail: 0.1, delay: [100, 500] })

  // all wrapped functions affected
  const api = cruel(fetch)
  await api("...") // has global + local chaos

  // disable when done
  cruel.disable()

> scoped chaos?

  await cruel.scope(async () => {
    // chaos only active in this scope
    await api("...")
  }, { fail: 0.2 })

> scenarios?

  // define scenario
  cruel.scenario("outage", {
    chaos: { fail: 1 },
    duration: 5000,
  })

  // play it
  await cruel.play("outage")

  // built-in scenarios
  await cruel.play("networkPartition")
  await cruel.play("highLatency")
  await cruel.play("degraded")
  await cruel.play("recovery")

> intercept fetch?

  // patch global fetch
  cruel.patchFetch()

  // add intercept rules
  cruel.intercept("api.openai.com", {
    rateLimit: { rate: 0.1, retryAfter: 60 },
    delay: [100, 500],
  })

  cruel.intercept(/api\.example\.com/, {
    fail: 0.1,
    status: [500, 502, 503],
  })

  // restore original
  cruel.unpatchFetch()

> profiles?

  // create profile
  cruel.profile("testing", { fail: 0.2, delay: 100 })

  // use it
  cruel.useProfile("testing")

> stats?

  const stats = cruel.stats()
  // {
  //   calls: 100,
  //   failures: 12,
  //   timeouts: 3,
  //   delays: 45,
  //   corrupted: 2,
  //   rateLimited: 5,
  //   streamsCut: 1,
  //   byTarget: Map { ... }
  // }

  cruel.resetStats()

> deterministic?

  // seed for reproducible chaos
  cruel.seed(12345)

  // same sequence every time
  cruel.coin(0.5) // always same result

> utilities?

  cruel.coin(0.5)           // random boolean
  cruel.pick([1, 2, 3])     // random item
  cruel.between(10, 100)    // random number
  cruel.maybe(value, 0.5)   // value or undefined
  await cruel.delay(500)    // sleep

> fluent api?

  const api = cruel.wrap(fetch)
    .slow(500)

  // or chain methods
  cruel.wrap(fn).fail(0.1)
  cruel.wrap(fn).timeout(0.05)
  cruel.wrap(fn).flaky()
  cruel.wrap(fn).nightmare()

> factory?

  import { createCruel } from "cruel"

  const myCruel = createCruel({ delay: 100 })
  const api = myCruel(fetch)

> errors?

  import {
    CruelError,
    CruelTimeoutError,
    CruelNetworkError,
    CruelHttpError,
    CruelRateLimitError,
    CruelAIError,
  } from "cruel"

  try {
    await api("...")
  } catch (e) {
    if (e instanceof CruelRateLimitError) {
      console.log("retry after:", e.retryAfter)
    }
    if (e instanceof CruelHttpError) {
      console.log("status:", e.status)
    }
    if (e instanceof CruelAIError) {
      console.log("type:", e.type)
    }
  }

> cli?

  # test endpoint with chaos
  cruel test https://api.example.com --fail 0.1 --count 20

  # use preset
  cruel test https://api.example.com --preset nightmare

  # run scenario
  cruel scenario outage --duration 5000

  # list presets
  cruel presets

> testing?

  import { describe, test, beforeEach } from "bun:test"
  import { cruel } from "cruel"

  beforeEach(() => {
    cruel.reset()
    cruel.seed(12345) // deterministic
  })

  test("handles failures", async () => {
    cruel.enable({ fail: 1 })
    await expect(api()).rejects.toThrow()
  })

  test("handles slow responses", async () => {
    cruel.enable({ delay: 1000 })
    const start = Date.now()
    await api()
    expect(Date.now() - start).toBeGreaterThan(900)
  })

> features?

  ✓ wrap any async function
  ✓ failures, timeouts, delays
  ✓ network simulation
  ✓ http status codes
  ✓ stream corruption
  ✓ ai sdk specific chaos
  ✓ fetch interception
  ✓ presets and profiles
  ✓ scenarios
  ✓ statistics tracking
  ✓ deterministic mode
  ✓ cli tool
  ✓ typescript native
  ✓ zero dependencies
  ✓ works everywhere
```

```
made with x_x
```
