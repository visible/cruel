type MaybePromise<T> = T | Promise<T>
type AnyFn = (...args: unknown[]) => unknown
type AsyncFn<T> = (...args: unknown[]) => Promise<T>

interface ChaosOptions {
  fail?: number
  delay?: number | [number, number]
  timeout?: number
  jitter?: number
  corrupt?: number
  spike?: number | [number, number]
  enabled?: boolean
}

interface NetworkOptions extends ChaosOptions {
  latency?: number | [number, number]
  packetLoss?: number
  bandwidth?: number
  disconnect?: number
  dns?: number
}

interface HttpOptions extends ChaosOptions {
  status?: number | number[]
  rateLimit?: number | { rate: number; status?: number; retryAfter?: number }
  slowBody?: number | [number, number]
  truncate?: number
  malformed?: number
  headers?: Record<string, string>
}

interface StreamOptions extends ChaosOptions {
  cut?: number
  pause?: number | [number, number]
  reorder?: number
  duplicate?: number
  dropChunks?: number
  corruptChunks?: number
}

interface ResourceOptions {
  memory?: number
  cpu?: number
  disk?: number
  handles?: number
}

interface AIOptions extends ChaosOptions {
  rateLimit?: number | { rate: number; retryAfter?: number }
  overloaded?: number
  contextLength?: number
  contentFilter?: number
  modelUnavailable?: number
  tokenLimit?: number
  streamCut?: number
  slowTokens?: number | [number, number]
  partialResponse?: number
  invalidJson?: number
}

interface ScenarioConfig {
  name: string
  duration?: number
  chaos?: ChaosOptions
  network?: NetworkOptions
  http?: HttpOptions
  stream?: StreamOptions
  resource?: ResourceOptions
  ai?: AIOptions
  ramp?: { start: number; end: number; over: number }
}

interface Stats {
  calls: number
  failures: number
  timeouts: number
  delays: number
  corrupted: number
  rateLimited: number
  streamsCut: number
  latencies: number[]
  byTarget: Map<string, { calls: number; failures: number; latencies: number[] }>
}

interface InterceptRule {
  pattern: string | RegExp
  options: HttpOptions | AIOptions
}

interface CruelConfig {
  enabled: boolean
  seed?: number
  log?: boolean
  safe?: boolean
}

const state = {
  enabled: false,
  config: {} as CruelConfig,
  globalChaos: {} as ChaosOptions,
  intercepts: [] as InterceptRule[],
  scenarios: new Map<string, ScenarioConfig>(),
  activeScenario: null as string | null,
  profiles: new Map<string, ChaosOptions>(),
  stats: {
    calls: 0,
    failures: 0,
    timeouts: 0,
    delays: 0,
    corrupted: 0,
    rateLimited: 0,
    streamsCut: 0,
    latencies: [],
    byTarget: new Map<string, { calls: number; failures: number; latencies: number[] }>(),
  } as Stats,
  originalFetch: globalThis.fetch,
  fetchPatched: false,
  timers: [] as ReturnType<typeof setTimeout>[],
}

class CruelError extends Error {
  code: string
  constructor(message = "cruel: injected failure", code = "CRUEL_FAILURE") {
    super(message)
    this.name = "CruelError"
    this.code = code
  }
}

class CruelTimeoutError extends CruelError {
  constructor() {
    super("cruel: injected timeout", "CRUEL_TIMEOUT")
    this.name = "CruelTimeoutError"
  }
}

class CruelNetworkError extends CruelError {
  constructor(type: string) {
    super(`cruel: network ${type}`, `CRUEL_NETWORK_${type.toUpperCase()}`)
    this.name = "CruelNetworkError"
  }
}

class CruelHttpError extends CruelError {
  status: number
  constructor(status: number, message?: string) {
    super(message ?? `cruel: http ${status}`, "CRUEL_HTTP")
    this.name = "CruelHttpError"
    this.status = status
  }
}

class CruelRateLimitError extends CruelHttpError {
  retryAfter?: number
  constructor(retryAfter?: number) {
    super(429, "cruel: rate limited")
    this.name = "CruelRateLimitError"
    this.retryAfter = retryAfter
  }
}

class CruelAIError extends CruelError {
  type: string
  constructor(type: string, message?: string) {
    super(message ?? `cruel: ai ${type}`, `CRUEL_AI_${type.toUpperCase()}`)
    this.name = "CruelAIError"
    this.type = type
  }
}

let rng = Math.random

function random(): number {
  return rng()
}

function seed(s: number): void {
  let x = s
  rng = () => {
    x = (x * 1103515245 + 12345) & 0x7fffffff
    return x / 0x7fffffff
  }
}

function resetRng(): void {
  rng = Math.random
}

function between(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min
}

function getDelay(d: number | [number, number] | undefined): number {
  if (d === undefined) return 0
  if (Array.isArray(d)) return between(d[0], d[1])
  return d
}

function chance(rate: number | undefined): boolean {
  if (rate === undefined || rate <= 0) return false
  if (rate >= 1) return true
  return random() < rate
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => {
    const t = setTimeout(r, ms)
    state.timers.push(t)
  })
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(random() * arr.length)]
}

function merge<T extends object>(...objs: (T | undefined)[]): T {
  return Object.assign({}, ...objs.filter(Boolean)) as T
}

function trackStats(target: string, failed: boolean, latency?: number): void {
  state.stats.calls++
  if (failed) state.stats.failures++
  if (latency !== undefined) state.stats.latencies.push(latency)
  const t = state.stats.byTarget.get(target) ?? { calls: 0, failures: 0, latencies: [] }
  t.calls++
  if (failed) t.failures++
  if (latency !== undefined) t.latencies.push(latency)
  state.stats.byTarget.set(target, t)
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

function getStatsWithPercentiles(stats: Stats) {
  return {
    ...stats,
    p50: percentile(stats.latencies, 50),
    p95: percentile(stats.latencies, 95),
    p99: percentile(stats.latencies, 99),
    avg: stats.latencies.length > 0
      ? Math.round(stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length)
      : 0,
    min: stats.latencies.length > 0 ? Math.min(...stats.latencies) : 0,
    max: stats.latencies.length > 0 ? Math.max(...stats.latencies) : 0,
    byTarget: new Map(stats.byTarget),
  }
}

async function applyChaos<T>(
  fn: () => MaybePromise<T>,
  opts: ChaosOptions,
  target = "unknown"
): Promise<T> {
  const start = Date.now()
  const o = state.enabled ? merge(state.globalChaos, opts) : opts
  if (o.enabled === false) return fn()

  if (chance(o.timeout)) {
    state.stats.timeouts++
    trackStats(target, true)
    return new Promise(() => {})
  }

  if (chance(o.fail)) {
    trackStats(target, true, Date.now() - start)
    throw new CruelError()
  }

  const delay = getDelay(o.delay)
  const jitter = o.jitter ? between(0, o.jitter) : 0
  const spike = o.spike ? getDelay(o.spike) : 0

  if (delay + jitter + spike > 0) {
    state.stats.delays++
    await sleep(delay + jitter + spike)
  }

  const result = await fn()
  trackStats(target, false, Date.now() - start)
  return result
}

function cruel<T extends AnyFn>(fn: T, options: ChaosOptions = {}): T {
  const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return applyChaos(() => fn(...args) as ReturnType<T>, options, fn.name || "fn")
  }
  return wrapped as T
}

cruel.fail = <T extends AnyFn>(fn: T, rate = 0.1): T => cruel(fn, { fail: rate })
cruel.slow = <T extends AnyFn>(fn: T, delay: number | [number, number] = 500): T =>
  cruel(fn, { delay })
cruel.timeout = <T extends AnyFn>(fn: T, rate = 0.1): T => cruel(fn, { timeout: rate })
cruel.flaky = <T extends AnyFn>(fn: T, intensity = 0.2): T =>
  cruel(fn, { fail: intensity * 0.5, timeout: intensity * 0.25, delay: [100, 1000] })
cruel.unreliable = <T extends AnyFn>(fn: T): T =>
  cruel(fn, { fail: 0.3, timeout: 0.1, delay: [200, 2000], jitter: 500 })
cruel.nightmare = <T extends AnyFn>(fn: T): T =>
  cruel(fn, { fail: 0.5, timeout: 0.2, delay: [500, 5000], jitter: 1000 })

const network = {
  latency: <T extends AnyFn>(fn: T, ms: number | [number, number]): T =>
    cruel(fn, { delay: ms }),

  packetLoss: <T extends AnyFn>(fn: T, rate = 0.1): T => {
    const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (chance(rate)) throw new CruelNetworkError("packet_loss")
      return fn(...args) as ReturnType<T>
    }
    return wrapped as T
  },

  disconnect: <T extends AnyFn>(fn: T, rate = 0.05): T => {
    const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (chance(rate)) throw new CruelNetworkError("disconnect")
      return fn(...args) as ReturnType<T>
    }
    return wrapped as T
  },

  dns: <T extends AnyFn>(fn: T, rate = 0.02): T => {
    const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (chance(rate)) throw new CruelNetworkError("dns_failure")
      return fn(...args) as ReturnType<T>
    }
    return wrapped as T
  },

  slow: <T extends AnyFn>(fn: T): T =>
    cruel(fn, { delay: [1000, 5000], jitter: 2000 }),

  unstable: <T extends AnyFn>(fn: T): T => {
    const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (chance(0.1)) throw new CruelNetworkError("disconnect")
      if (chance(0.05)) throw new CruelNetworkError("packet_loss")
      await sleep(between(100, 2000))
      return fn(...args) as ReturnType<T>
    }
    return wrapped as T
  },

  offline: <T extends AnyFn>(fn: T): T => {
    const wrapped = async (): Promise<ReturnType<T>> => {
      throw new CruelNetworkError("offline")
    }
    return wrapped as T
  },
}

const http = {
  status: <T extends AnyFn>(fn: T, code: number | number[], rate = 1): T => {
    const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (chance(rate)) {
        const status = Array.isArray(code) ? pick(code) : code
        throw new CruelHttpError(status)
      }
      return fn(...args) as ReturnType<T>
    }
    return wrapped as T
  },

  rateLimit: <T extends AnyFn>(
    fn: T,
    opts: number | { rate: number; retryAfter?: number } = 0.1
  ): T => {
    const rate = typeof opts === "number" ? opts : opts.rate
    const retryAfter = typeof opts === "number" ? undefined : opts.retryAfter
    const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (chance(rate)) {
        state.stats.rateLimited++
        throw new CruelRateLimitError(retryAfter)
      }
      return fn(...args) as ReturnType<T>
    }
    return wrapped as T
  },

  serverError: <T extends AnyFn>(fn: T, rate = 0.1): T =>
    http.status(fn, [500, 502, 503, 504], rate),

  clientError: <T extends AnyFn>(fn: T, rate = 0.1): T =>
    http.status(fn, [400, 401, 403, 404], rate),

  slowResponse: <T extends AnyFn>(fn: T, ms: number | [number, number] = [1000, 5000]): T =>
    cruel(fn, { delay: ms }),

  badGateway: <T extends AnyFn>(fn: T, rate = 0.1): T => http.status(fn, 502, rate),

  serviceUnavailable: <T extends AnyFn>(fn: T, rate = 0.1): T => http.status(fn, 503, rate),

  gatewayTimeout: <T extends AnyFn>(fn: T, rate = 0.1): T => http.status(fn, 504, rate),
}

const stream = {
  cut: <T extends AnyFn>(fn: T, rate = 0.1): T => {
    const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      const result = await fn(...args)
      if (chance(rate)) {
        state.stats.streamsCut++
        throw new CruelError("stream cut mid-transfer", "CRUEL_STREAM_CUT")
      }
      return result as ReturnType<T>
    }
    return wrapped as T
  },

  pause: <T extends AnyFn>(fn: T, ms: number | [number, number] = [500, 2000]): T => {
    const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      const result = await fn(...args)
      await sleep(getDelay(ms))
      return result as ReturnType<T>
    }
    return wrapped as T
  },

  corrupt: <T extends AsyncFn<string>>(fn: T, rate = 0.1): T => {
    const wrapped = async (...args: Parameters<T>): Promise<string> => {
      let result = (await fn(...args)) as string
      if (chance(rate) && typeof result === "string") {
        state.stats.corrupted++
        const pos = Math.floor(random() * result.length)
        result = result.slice(0, pos) + "�" + result.slice(pos + 1)
      }
      return result
    }
    return wrapped as T
  },

  truncate: <T extends AsyncFn<string>>(fn: T, rate = 0.1): T => {
    const wrapped = async (...args: Parameters<T>): Promise<string> => {
      let result = (await fn(...args)) as string
      if (chance(rate) && typeof result === "string") {
        const cutPoint = Math.floor(random() * result.length * 0.8)
        result = result.slice(0, cutPoint)
      }
      return result
    }
    return wrapped as T
  },

  slow: <T extends AnyFn>(fn: T): T => stream.pause(fn, [1000, 5000]),

  flaky: <T extends AnyFn>(fn: T): T => {
    let current = fn
    current = stream.cut(current, 0.1)
    current = stream.pause(current, [100, 1000])
    return current
  },
}

const ai = {
  rateLimit: <T extends AnyFn>(
    fn: T,
    opts: number | { rate: number; retryAfter?: number } = 0.1
  ): T => {
    const rate = typeof opts === "number" ? opts : opts.rate
    const retryAfter = typeof opts === "number" ? 60 : opts.retryAfter
    const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (chance(rate)) {
        state.stats.rateLimited++
        throw new CruelAIError("rate_limit", `rate limited, retry after ${retryAfter}s`)
      }
      return fn(...args) as ReturnType<T>
    }
    return wrapped as T
  },

  overloaded: <T extends AnyFn>(fn: T, rate = 0.05): T => {
    const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (chance(rate)) throw new CruelAIError("overloaded", "model is overloaded")
      return fn(...args) as ReturnType<T>
    }
    return wrapped as T
  },

  contextLength: <T extends AnyFn>(fn: T, rate = 0.02): T => {
    const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (chance(rate)) throw new CruelAIError("context_length", "context length exceeded")
      return fn(...args) as ReturnType<T>
    }
    return wrapped as T
  },

  contentFilter: <T extends AnyFn>(fn: T, rate = 0.01): T => {
    const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (chance(rate)) throw new CruelAIError("content_filter", "content filter triggered")
      return fn(...args) as ReturnType<T>
    }
    return wrapped as T
  },

  modelUnavailable: <T extends AnyFn>(fn: T, rate = 0.02): T => {
    const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (chance(rate)) throw new CruelAIError("model_unavailable", "model not available")
      return fn(...args) as ReturnType<T>
    }
    return wrapped as T
  },

  slowTokens: <T extends AnyFn>(fn: T, ms: number | [number, number] = [50, 200]): T =>
    cruel(fn, { delay: ms }),

  streamCut: <T extends AnyFn>(fn: T, rate = 0.1): T => {
    const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      const result = await fn(...args)
      if (chance(rate)) {
        state.stats.streamsCut++
        throw new CruelAIError("stream_cut", "stream terminated unexpectedly")
      }
      return result as ReturnType<T>
    }
    return wrapped as T
  },

  partialResponse: <T extends AsyncFn<string>>(fn: T, rate = 0.1): T => {
    const wrapped = async (...args: Parameters<T>): Promise<string> => {
      let result = (await fn(...args)) as string
      if (chance(rate) && typeof result === "string") {
        const cutPoint = Math.floor(random() * result.length * 0.7) + result.length * 0.1
        result = result.slice(0, cutPoint)
      }
      return result
    }
    return wrapped as T
  },

  invalidJson: <T extends AsyncFn<string>>(fn: T, rate = 0.05): T => {
    const wrapped = async (...args: Parameters<T>): Promise<string> => {
      const result = (await fn(...args)) as string
      if (chance(rate)) {
        state.stats.corrupted++
        return result + "\\n{invalid"
      }
      return result
    }
    return wrapped as T
  },

  hallucinate: <T extends AnyFn>(fn: T): T =>
    cruel(fn, { delay: [100, 500] }),

  thinking: <T extends AnyFn>(fn: T): T =>
    cruel(fn, { delay: [2000, 10000] }),

  realistic: <T extends AnyFn>(fn: T): T => {
    let current = fn
    current = ai.rateLimit(current, 0.05)
    current = ai.overloaded(current, 0.02)
    current = ai.slowTokens(current, [30, 100])
    return current
  },

  nightmare: <T extends AnyFn>(fn: T): T => {
    let current = fn
    current = ai.rateLimit(current, 0.2)
    current = ai.overloaded(current, 0.1)
    current = ai.streamCut(current, 0.15)
    current = ai.slowTokens(current, [100, 500])
    return current
  },
}

cruel.network = network
cruel.http = http
cruel.stream = stream
cruel.ai = ai

cruel.enable = (opts: ChaosOptions = {}): void => {
  state.enabled = true
  state.globalChaos = opts
}

cruel.disable = (): void => {
  state.enabled = false
  state.globalChaos = {}
}

cruel.toggle = (): boolean => {
  state.enabled = !state.enabled
  return state.enabled
}

cruel.isEnabled = (): boolean => state.enabled

cruel.configure = (config: CruelConfig): void => {
  state.config = config
  state.enabled = config.enabled
  if (config.seed !== undefined) seed(config.seed)
}

cruel.reset = (): void => {
  state.enabled = false
  state.globalChaos = {}
  state.config = {} as CruelConfig
  state.intercepts = []
  state.scenarios.clear()
  state.profiles.clear()
  state.activeScenario = null
  state.stats = {
    calls: 0,
    failures: 0,
    timeouts: 0,
    delays: 0,
    corrupted: 0,
    rateLimited: 0,
    streamsCut: 0,
    latencies: [],
    byTarget: new Map(),
  }
  state.timers.forEach(clearTimeout)
  state.timers = []
  resetRng()
  if (state.fetchPatched) {
    globalThis.fetch = state.originalFetch
    state.fetchPatched = false
  }
}

cruel.stats = () => getStatsWithPercentiles(state.stats)

cruel.resetStats = (): void => {
  state.stats = {
    calls: 0,
    failures: 0,
    timeouts: 0,
    delays: 0,
    corrupted: 0,
    rateLimited: 0,
    streamsCut: 0,
    latencies: [],
    byTarget: new Map(),
  }
}

cruel.seed = seed

cruel.scope = async <T>(
  fn: () => MaybePromise<T>,
  opts: ChaosOptions = {}
): Promise<T> => {
  const prev = { enabled: state.enabled, chaos: state.globalChaos }
  state.enabled = true
  state.globalChaos = opts
  try {
    return await fn()
  } finally {
    state.enabled = prev.enabled
    state.globalChaos = prev.chaos
  }
}

cruel.profile = (name: string, opts: ChaosOptions): void => {
  state.profiles.set(name, opts)
}

cruel.useProfile = (name: string): void => {
  const profile = state.profiles.get(name)
  if (!profile) throw new Error(`cruel: profile "${name}" not found`)
  state.enabled = true
  state.globalChaos = profile
}

cruel.scenario = (name: string, config: Omit<ScenarioConfig, "name">): void => {
  state.scenarios.set(name, { name, ...config })
}

cruel.play = async (name: string): Promise<void> => {
  const scenario = state.scenarios.get(name)
  if (!scenario) throw new Error(`cruel: scenario "${name}" not found`)
  state.activeScenario = name
  state.enabled = true
  if (scenario.chaos) state.globalChaos = scenario.chaos
  if (scenario.duration) {
    await sleep(scenario.duration)
    cruel.stop()
  }
}

cruel.stop = (): void => {
  state.activeScenario = null
  state.enabled = false
  state.globalChaos = {}
}

cruel.activeScenario = (): string | null => state.activeScenario

cruel.intercept = (pattern: string | RegExp, opts: HttpOptions | AIOptions): void => {
  state.intercepts.push({ pattern, options: opts })
}

cruel.clearIntercepts = (): void => {
  state.intercepts = []
}

cruel.patchFetch = (): void => {
  if (state.fetchPatched) return
  state.originalFetch = globalThis.fetch
  state.fetchPatched = true

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url

    for (const rule of state.intercepts) {
      const matches =
        typeof rule.pattern === "string"
          ? url.includes(rule.pattern)
          : rule.pattern.test(url)

      if (matches) {
        const opts = rule.options as HttpOptions

        if (chance(opts.timeout)) {
          state.stats.timeouts++
          return new Promise(() => {})
        }

        if (chance(opts.fail)) {
          state.stats.failures++
          throw new CruelNetworkError("fetch_failed")
        }

        const rl = opts.rateLimit
        if (rl) {
          const rate = typeof rl === "number" ? rl : rl.rate
          if (chance(rate)) {
            state.stats.rateLimited++
            const retryAfter = typeof rl === "number" ? 60 : rl.retryAfter ?? 60
            return new Response(JSON.stringify({ error: "rate limited" }), {
              status: 429,
              headers: { "Retry-After": String(retryAfter) },
            })
          }
        }

        if (opts.status) {
          const status = Array.isArray(opts.status) ? pick(opts.status) : opts.status
          if (chance(opts.fail ?? 1)) {
            return new Response(JSON.stringify({ error: `http ${status}` }), { status })
          }
        }

        const delay = getDelay(opts.delay)
        if (delay > 0) {
          state.stats.delays++
          await sleep(delay)
        }
      }
    }

    return state.originalFetch(input, init)
  }
}

cruel.unpatchFetch = (): void => {
  if (!state.fetchPatched) return
  globalThis.fetch = state.originalFetch
  state.fetchPatched = false
}

cruel.wrap = <T extends AnyFn>(fn: T) => ({
  fail: (rate?: number) => cruel.fail(fn, rate),
  slow: (delay?: number | [number, number]) => cruel.slow(fn, delay),
  timeout: (rate?: number) => cruel.timeout(fn, rate),
  flaky: (intensity?: number) => cruel.flaky(fn, intensity),
  unreliable: () => cruel.unreliable(fn),
  nightmare: () => cruel.nightmare(fn),
  with: (opts: ChaosOptions) => cruel(fn, opts),
})

cruel.maybe = <T>(value: T, rate = 0.5): T | undefined => {
  return chance(rate) ? value : undefined
}

cruel.delay = (ms: number | [number, number]): Promise<void> => sleep(getDelay(ms))

cruel.coin = (rate = 0.5): boolean => chance(rate)

cruel.pick = pick

cruel.between = between

cruel.errors = {
  CruelError,
  CruelTimeoutError,
  CruelNetworkError,
  CruelHttpError,
  CruelRateLimitError,
  CruelAIError,
}

const presets: Record<string, ChaosOptions> = {
  development: { fail: 0.01, delay: [10, 100] as [number, number] },
  staging: { fail: 0.05, delay: [50, 500] as [number, number], timeout: 0.02 },
  production: { fail: 0.1, delay: [100, 1000] as [number, number], timeout: 0.05 },
  harsh: { fail: 0.2, delay: [500, 2000] as [number, number], timeout: 0.1, jitter: 500 },
  nightmare: { fail: 0.4, delay: [1000, 5000] as [number, number], timeout: 0.2, jitter: 2000 },
  apocalypse: { fail: 0.6, delay: [2000, 10000] as [number, number], timeout: 0.3, jitter: 5000 },
}

cruel.presets = presets

const scenarios: Record<string, Omit<ScenarioConfig, "name">> = {
  networkPartition: { chaos: { fail: 1 }, duration: 5000 },
  highLatency: { chaos: { delay: [2000, 5000] as [number, number] }, duration: 10000 },
  degraded: { chaos: { fail: 0.1, delay: [500, 1500] as [number, number] }, duration: 30000 },
  outage: { chaos: { fail: 1, timeout: 0.5 }, duration: 60000 },
  recovery: { chaos: { fail: 0.3, delay: [100, 500] as [number, number] }, duration: 15000 },
  blackFriday: { chaos: { delay: [1000, 3000] as [number, number], fail: 0.15, jitter: 1000 }, duration: 60000 },
  mobileNetwork: { chaos: { delay: [500, 2000] as [number, number], fail: 0.2, timeout: 0.1 }, duration: 30000 },
  datacenterFailover: { chaos: { fail: 0.5, delay: [200, 800] as [number, number] }, duration: 20000 },
  ddosAttack: { chaos: { timeout: 0.4, delay: [2000, 10000] as [number, number] }, duration: 30000 },
  coldStart: { chaos: { delay: [3000, 8000] as [number, number] }, duration: 10000 },
  gcPause: { chaos: { delay: [100, 500] as [number, number], spike: [500, 2000] as [number, number] }, duration: 15000 },
  connectionPool: { chaos: { fail: 0.3, timeout: 0.2 }, duration: 20000 },
}

Object.entries(scenarios).forEach(([name, config]) => {
  cruel.scenario(name, config)
})

interface MemoryPressureOptions {
  size?: number
  duration?: number
  onStart?: () => void
  onEnd?: () => void
}

function simulateMemoryPressure(options: MemoryPressureOptions = {}): () => void {
  const size = options.size ?? 50 * 1024 * 1024
  const arrays: Uint8Array[] = []
  const chunkSize = 1024 * 1024

  options.onStart?.()

  let allocated = 0
  while (allocated < size) {
    const chunk = new Uint8Array(chunkSize)
    chunk.fill(Math.floor(Math.random() * 256))
    arrays.push(chunk)
    allocated += chunkSize
  }

  const cleanup = () => {
    arrays.length = 0
    options.onEnd?.()
  }

  if (options.duration) {
    setTimeout(cleanup, options.duration)
  }

  return cleanup
}

interface CpuPressureOptions {
  duration?: number
  intensity?: number
  onStart?: () => void
  onEnd?: () => void
}

function simulateCpuPressure(options: CpuPressureOptions = {}): () => void {
  const duration = options.duration ?? 1000
  const intensity = options.intensity ?? 0.8
  let running = true

  options.onStart?.()

  const busyWork = () => {
    if (!running) return
    const start = Date.now()
    while (Date.now() - start < intensity * 10) {
      Math.random() * Math.random()
    }
    setTimeout(busyWork, (1 - intensity) * 10)
  }

  busyWork()

  const timeoutId = setTimeout(() => {
    running = false
    options.onEnd?.()
  }, duration)

  return () => {
    running = false
    clearTimeout(timeoutId)
    options.onEnd?.()
  }
}

cruel.memory = simulateMemoryPressure
cruel.cpu = simulateCpuPressure

interface CircuitBreakerOptions {
  threshold: number
  timeout: number
  onOpen?: () => void
  onClose?: () => void
  onHalfOpen?: () => void
}

interface CircuitBreakerState {
  failures: number
  state: "closed" | "open" | "half-open"
  lastFailure: number
}

function createCircuitBreaker<T extends AnyFn>(
  fn: T,
  options: CircuitBreakerOptions
): T & { getState: () => CircuitBreakerState; reset: () => void } {
  const cbState: CircuitBreakerState = {
    failures: 0,
    state: "closed",
    lastFailure: 0,
  }

  const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (cbState.state === "open") {
      if (Date.now() - cbState.lastFailure > options.timeout) {
        cbState.state = "half-open"
        options.onHalfOpen?.()
      } else {
        throw new CruelError("circuit breaker is open", "CRUEL_CIRCUIT_OPEN")
      }
    }

    try {
      const result = await fn(...args)
      if (cbState.state === "half-open") {
        cbState.state = "closed"
        cbState.failures = 0
        options.onClose?.()
      }
      return result as ReturnType<T>
    } catch (e) {
      cbState.failures++
      cbState.lastFailure = Date.now()
      if (cbState.failures >= options.threshold) {
        cbState.state = "open"
        options.onOpen?.()
      }
      throw e
    }
  }

  const result = wrapped as T & { getState: () => CircuitBreakerState; reset: () => void }
  result.getState = () => ({ ...cbState })
  result.reset = () => {
    cbState.failures = 0
    cbState.state = "closed"
    cbState.lastFailure = 0
  }

  return result
}

interface RetryOptions {
  attempts: number
  delay?: number | [number, number]
  backoff?: "fixed" | "linear" | "exponential"
  maxDelay?: number
  onRetry?: (attempt: number, error: Error) => void
  retryIf?: (error: Error) => boolean
}

function withRetry<T extends AnyFn>(fn: T, options: RetryOptions): T {
  const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    let lastError: Error | undefined
    for (let attempt = 1; attempt <= options.attempts; attempt++) {
      try {
        return (await fn(...args)) as ReturnType<T>
      } catch (e) {
        lastError = e as Error
        if (options.retryIf && !options.retryIf(lastError)) {
          throw lastError
        }
        if (attempt < options.attempts) {
          options.onRetry?.(attempt, lastError)
          let delay = getDelay(options.delay ?? 1000)
          if (options.backoff === "linear") {
            delay = delay * attempt
          } else if (options.backoff === "exponential") {
            delay = delay * Math.pow(2, attempt - 1)
          }
          if (options.maxDelay) {
            delay = Math.min(delay, options.maxDelay)
          }
          await sleep(delay)
        }
      }
    }
    throw lastError
  }
  return wrapped as T
}

interface BulkheadOptions {
  maxConcurrent: number
  maxQueue?: number
  onReject?: () => void
}

function createBulkhead<T extends AnyFn>(fn: T, options: BulkheadOptions): T {
  let running = 0
  const queue: Array<{
    args: Parameters<T>
    resolve: (value: ReturnType<T>) => void
    reject: (error: Error) => void
  }> = []

  const processQueue = async () => {
    if (running >= options.maxConcurrent || queue.length === 0) return
    const item = queue.shift()
    if (!item) return
    running++
    try {
      const result = await fn(...item.args)
      item.resolve(result as ReturnType<T>)
    } catch (e) {
      item.reject(e as Error)
    } finally {
      running--
      processQueue()
    }
  }

  const wrapped = (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve, reject) => {
      if (running < options.maxConcurrent) {
        running++
        ;(fn(...args) as Promise<ReturnType<T>>)
          .then((result: ReturnType<T>) => {
            resolve(result)
            running--
            processQueue()
          })
          .catch((e: Error) => {
            reject(e)
            running--
            processQueue()
          })
      } else if (!options.maxQueue || queue.length < options.maxQueue) {
        queue.push({ args, resolve, reject })
      } else {
        options.onReject?.()
        reject(new CruelError("bulkhead queue full", "CRUEL_BULKHEAD_FULL"))
      }
    })
  }

  return wrapped as T
}

interface TimeoutOptions {
  ms: number
  onTimeout?: () => void
}

function withTimeout<T extends AnyFn>(fn: T, options: TimeoutOptions): T {
  const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return Promise.race([
      fn(...args) as Promise<ReturnType<T>>,
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          options.onTimeout?.()
          reject(new CruelTimeoutError())
        }, options.ms)
      }),
    ])
  }
  return wrapped as T
}

interface FallbackOptions<T> {
  fallback: T | (() => T) | (() => Promise<T>)
  onFallback?: (error: Error) => void
}

function withFallback<T extends AnyFn>(
  fn: T,
  options: FallbackOptions<ReturnType<T>>
): T {
  const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return (await fn(...args)) as ReturnType<T>
    } catch (e) {
      options.onFallback?.(e as Error)
      const fb = options.fallback
      if (typeof fb === "function") {
        return (fb as () => ReturnType<T>)()
      }
      return fb
    }
  }
  return wrapped as T
}

interface HedgeOptions {
  count: number
  delay: number
}

function withHedge<T extends AnyFn>(fn: T, options: HedgeOptions): T {
  const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const promises: Promise<ReturnType<T>>[] = []
    const errors: Error[] = []

    for (let i = 0; i < options.count; i++) {
      if (i > 0) {
        await sleep(options.delay)
      }
      promises.push(
        (fn(...args) as Promise<ReturnType<T>>).catch((e) => {
          errors.push(e)
          throw e
        })
      )
    }

    try {
      return await Promise.any(promises)
    } catch {
      throw errors[0] || new CruelError("all hedged requests failed", "CRUEL_HEDGE_FAILED")
    }
  }
  return wrapped as T
}

interface RateLimiterOptions {
  requests: number
  interval: number
  onLimit?: () => void
}

interface RateLimiterState {
  tokens: number
  lastRefill: number
}

function createRateLimiter<T extends AnyFn>(fn: T, options: RateLimiterOptions): T {
  const rlState: RateLimiterState = {
    tokens: options.requests,
    lastRefill: Date.now(),
  }

  const refill = () => {
    const now = Date.now()
    const elapsed = now - rlState.lastRefill
    const tokensToAdd = Math.floor(elapsed / options.interval) * options.requests
    if (tokensToAdd > 0) {
      rlState.tokens = Math.min(options.requests, rlState.tokens + tokensToAdd)
      rlState.lastRefill = now
    }
  }

  const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    refill()
    if (rlState.tokens <= 0) {
      options.onLimit?.()
      throw new CruelRateLimitError(Math.ceil(options.interval / 1000))
    }
    rlState.tokens--
    return fn(...args) as ReturnType<T>
  }
  return wrapped as T
}

interface CacheOptions<T> {
  ttl: number
  key?: (...args: unknown[]) => string
  onHit?: (key: string) => void
  onMiss?: (key: string) => void
}

function withCache<T extends AnyFn>(fn: T, options: CacheOptions<ReturnType<T>>): T {
  const cache = new Map<string, { value: ReturnType<T>; expires: number }>()

  const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = options.key ? options.key(...args) : JSON.stringify(args)
    const cached = cache.get(key)

    if (cached && cached.expires > Date.now()) {
      options.onHit?.(key)
      return cached.value
    }

    options.onMiss?.(key)
    const result = (await fn(...args)) as ReturnType<T>
    cache.set(key, { value: result, expires: Date.now() + options.ttl })
    return result
  }
  return wrapped as T
}

type CruelEventType = "call" | "success" | "failure" | "timeout" | "retry" | "circuitOpen" | "circuitClose"
type CruelEventHandler = (event: { type: CruelEventType; target?: string; error?: Error; duration?: number }) => void

const eventHandlers: CruelEventHandler[] = []

function emitEvent(type: CruelEventType, data: { target?: string; error?: Error; duration?: number } = {}) {
  eventHandlers.forEach((handler) => handler({ type, ...data }))
}

cruel.on = (handler: CruelEventHandler): (() => void) => {
  eventHandlers.push(handler)
  return () => {
    const index = eventHandlers.indexOf(handler)
    if (index > -1) eventHandlers.splice(index, 1)
  }
}

cruel.removeAllListeners = () => {
  eventHandlers.length = 0
}

interface AbortableOptions {
  signal?: AbortSignal
}

function withAbort<T extends AnyFn>(fn: T, options: AbortableOptions): T {
  const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (options.signal?.aborted) {
      throw new CruelError("operation aborted", "CRUEL_ABORTED")
    }

    return new Promise((resolve, reject) => {
      const abortHandler = () => {
        reject(new CruelError("operation aborted", "CRUEL_ABORTED"))
      }

      options.signal?.addEventListener("abort", abortHandler, { once: true })

      ;(fn(...args) as Promise<ReturnType<T>>)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          options.signal?.removeEventListener("abort", abortHandler)
        })
    })
  }
  return wrapped as T
}

interface WrapOptions extends ChaosOptions {
  retry?: RetryOptions
  circuitBreaker?: CircuitBreakerOptions
  bulkhead?: BulkheadOptions
  timeout?: number
  fallback?: unknown
  cache?: CacheOptions<unknown>
  rateLimiter?: RateLimiterOptions
  hedge?: HedgeOptions
}

function wrap<T extends AnyFn>(fn: T, options: WrapOptions): T {
  let wrapped = fn

  if (options.cache) {
    wrapped = withCache(wrapped, options.cache as CacheOptions<ReturnType<T>>)
  }

  if (options.rateLimiter) {
    wrapped = createRateLimiter(wrapped, options.rateLimiter)
  }

  if (options.bulkhead) {
    wrapped = createBulkhead(wrapped, options.bulkhead)
  }

  if (options.circuitBreaker) {
    wrapped = createCircuitBreaker(wrapped, options.circuitBreaker)
  }

  if (options.retry) {
    wrapped = withRetry(wrapped, options.retry)
  }

  if (options.timeout && typeof options.timeout === "number" && options.timeout > 0) {
    wrapped = withTimeout(wrapped, { ms: options.timeout })
  }

  if (options.fallback !== undefined) {
    wrapped = withFallback(wrapped, { fallback: options.fallback as ReturnType<T> })
  }

  if (options.hedge) {
    wrapped = withHedge(wrapped, options.hedge)
  }

  const chaosOpts: ChaosOptions = {
    fail: options.fail,
    delay: options.delay,
    jitter: options.jitter,
    enabled: options.enabled,
  }

  if (Object.values(chaosOpts).some((v) => v !== undefined)) {
    wrapped = cruel(wrapped, chaosOpts)
  }

  return wrapped
}

cruel.circuitBreaker = createCircuitBreaker
cruel.retry = withRetry
cruel.bulkhead = createBulkhead
cruel.hedge = withHedge
cruel.rateLimiter = createRateLimiter
cruel.cache = withCache
cruel.abort = withAbort
cruel.compose = wrap
cruel.timeout = <T extends AnyFn>(fn: T, rate = 0.1): T => cruel(fn, { timeout: rate })
cruel.withTimeout = withTimeout
cruel.fallback = withFallback

function createCruel(defaults: ChaosOptions = {}) {
  const instance = <T extends AnyFn>(fn: T, opts: ChaosOptions = {}): T =>
    cruel(fn, merge(defaults, opts))

  instance.fail = <T extends AnyFn>(fn: T, rate?: number) =>
    cruel.fail(fn, rate ?? defaults.fail ?? 0.1)
  instance.slow = <T extends AnyFn>(fn: T, delay?: number | [number, number]) =>
    cruel.slow(fn, delay ?? defaults.delay ?? 500)
  instance.timeout = <T extends AnyFn>(fn: T, rate?: number) =>
    cruel.timeout(fn, rate ?? defaults.timeout ?? 0.1)
  instance.flaky = <T extends AnyFn>(fn: T, intensity?: number) =>
    cruel.flaky(fn, intensity ?? 0.2)

  instance.network = network
  instance.http = http
  instance.stream = stream
  instance.ai = ai

  return instance
}

export {
  cruel,
  createCruel,
  createCircuitBreaker,
  withRetry,
  createBulkhead,
  withTimeout,
  withFallback,
  withHedge,
  createRateLimiter,
  withCache,
  withAbort,
  wrap,
  emitEvent,
  CruelError,
  CruelTimeoutError,
  CruelNetworkError,
  CruelHttpError,
  CruelRateLimitError,
  CruelAIError,
  type ChaosOptions,
  type NetworkOptions,
  type HttpOptions,
  type StreamOptions,
  type ResourceOptions,
  type AIOptions,
  type ScenarioConfig,
  type Stats,
  type CruelConfig,
  type CircuitBreakerOptions,
  type RetryOptions,
  type BulkheadOptions,
  type TimeoutOptions,
  type FallbackOptions,
  type HedgeOptions,
  type RateLimiterOptions,
  type CacheOptions,
  type WrapOptions,
  type CruelEventType,
  type CruelEventHandler,
  type AbortableOptions,
}

export {
  aisdk,
  createChaosMiddleware,
  wrapProvider,
  wrapModel,
  wrapTool,
  wrapTools,
  AISDKError,
  RateLimitError,
  OverloadedError,
  ContextLengthError,
  ContentFilterError,
  ModelUnavailableError,
  InvalidApiKeyError,
  QuotaExceededError,
  StreamCutError,
  ToolExecutionError,
  NoSuchToolError,
  InvalidToolArgumentsError,
  EmptyResponseError,
  type AISDKChaosOptions,
  type MiddlewareOptions,
  type ProviderOptions,
} from "./aisdk.js"

export { matchers, setupMatchers } from "./matchers.js"
