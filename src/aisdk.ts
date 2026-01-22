import type { ChaosOptions } from "./index.js"
import { cruel } from "./index.js"

interface AISDKChaosOptions extends ChaosOptions {
  rateLimit?: number | { rate: number; retryAfter?: number }
  overloaded?: number
  contextLength?: number
  contentFilter?: number
  modelUnavailable?: number
  invalidApiKey?: number
  quotaExceeded?: number
  streamCut?: number
  slowTokens?: number | [number, number]
  partialResponse?: number
  corruptChunks?: number
  toolFailure?: number
  toolTimeout?: number
  maxRetries?: number
}

interface MiddlewareOptions extends AISDKChaosOptions {
  name?: string
  log?: boolean
}

interface ProviderOptions extends AISDKChaosOptions {
  models?: Record<string, AISDKChaosOptions>
}

type LanguageModelV1 = {
  specificationVersion: "v1"
  provider: string
  modelId: string
  defaultObjectGenerationMode?: "json" | "tool" | "grammar" | undefined
  supportsImageUrls?: boolean
  doGenerate: (options: unknown) => Promise<unknown>
  doStream: (options: unknown) => Promise<unknown>
}

type Middleware = {
  transformParams?: (options: { params: unknown }) => Promise<unknown> | unknown
  wrapGenerate?: (options: {
    doGenerate: () => Promise<unknown>
    params: unknown
  }) => Promise<unknown>
  wrapStream?: (options: {
    doStream: () => Promise<unknown>
    params: unknown
  }) => Promise<unknown>
}

class AISDKError extends Error {
  code: string
  statusCode?: number
  retryAfter?: number

  constructor(
    code: string,
    message: string,
    options?: { statusCode?: number; retryAfter?: number }
  ) {
    super(message)
    this.name = "AISDKError"
    this.code = code
    this.statusCode = options?.statusCode
    this.retryAfter = options?.retryAfter
  }
}

class RateLimitError extends AISDKError {
  constructor(retryAfter?: number) {
    super("rate_limit_exceeded", "Rate limit exceeded. Please retry after cooling down.", {
      statusCode: 429,
      retryAfter,
    })
    this.name = "RateLimitError"
  }
}

class OverloadedError extends AISDKError {
  constructor() {
    super("overloaded", "The model is currently overloaded. Please try again later.", {
      statusCode: 529,
    })
    this.name = "OverloadedError"
  }
}

class ContextLengthError extends AISDKError {
  constructor() {
    super(
      "context_length_exceeded",
      "The request exceeds the maximum context length for this model.",
      { statusCode: 400 }
    )
    this.name = "ContextLengthError"
  }
}

class ContentFilterError extends AISDKError {
  constructor() {
    super("content_filter", "The response was filtered due to content policy.", {
      statusCode: 400,
    })
    this.name = "ContentFilterError"
  }
}

class ModelUnavailableError extends AISDKError {
  constructor(modelId?: string) {
    super(
      "model_unavailable",
      `The model ${modelId ?? "requested"} is currently unavailable.`,
      { statusCode: 503 }
    )
    this.name = "ModelUnavailableError"
  }
}

class InvalidApiKeyError extends AISDKError {
  constructor() {
    super("invalid_api_key", "The API key provided is invalid or has been revoked.", {
      statusCode: 401,
    })
    this.name = "InvalidApiKeyError"
  }
}

class QuotaExceededError extends AISDKError {
  constructor() {
    super("quota_exceeded", "You have exceeded your API quota.", { statusCode: 402 })
    this.name = "QuotaExceededError"
  }
}

class StreamCutError extends AISDKError {
  constructor() {
    super("stream_interrupted", "The response stream was interrupted unexpectedly.", {
      statusCode: 500,
    })
    this.name = "StreamCutError"
  }
}

class ToolExecutionError extends AISDKError {
  toolName: string
  constructor(toolName: string) {
    super("tool_execution_failed", `Tool '${toolName}' execution failed.`, {
      statusCode: 500,
    })
    this.name = "ToolExecutionError"
    this.toolName = toolName
  }
}

function random(): number {
  return Math.random()
}

function chance(rate: number | undefined): boolean {
  if (rate === undefined || rate <= 0) return false
  if (rate >= 1) return true
  return random() < rate
}

function between(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min
}

function getDelay(d: number | [number, number] | undefined): number {
  if (d === undefined) return 0
  if (Array.isArray(d)) return between(d[0], d[1])
  return d
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function applyAIChaos(opts: AISDKChaosOptions, modelId?: string): Promise<void> {
  if (chance(opts.invalidApiKey)) {
    throw new InvalidApiKeyError()
  }

  if (chance(opts.quotaExceeded)) {
    throw new QuotaExceededError()
  }

  if (chance(opts.modelUnavailable)) {
    throw new ModelUnavailableError(modelId)
  }

  if (chance(opts.contextLength)) {
    throw new ContextLengthError()
  }

  if (chance(opts.contentFilter)) {
    throw new ContentFilterError()
  }

  const rl = opts.rateLimit
  if (rl) {
    const rate = typeof rl === "number" ? rl : rl.rate
    const retryAfter = typeof rl === "number" ? 60 : rl.retryAfter
    if (chance(rate)) {
      throw new RateLimitError(retryAfter)
    }
  }

  if (chance(opts.overloaded)) {
    throw new OverloadedError()
  }

  if (chance(opts.timeout)) {
    await new Promise(() => {})
  }

  if (chance(opts.fail)) {
    throw new AISDKError("generation_failed", "Text generation failed unexpectedly.")
  }

  const delay = getDelay(opts.delay)
  if (delay > 0) {
    await sleep(delay)
  }
}

function createChaosMiddleware(options: MiddlewareOptions = {}): Middleware {
  const opts = options
  const name = opts.name ?? "cruel-middleware"

  return {
    transformParams: async ({ params }) => {
      if (opts.log) {
        console.log(`[${name}] transformParams called`)
      }
      return params
    },

    wrapGenerate: async ({ doGenerate, params }) => {
      if (opts.log) {
        console.log(`[${name}] wrapGenerate called`)
      }

      await applyAIChaos(opts)

      const result = await doGenerate()

      if (chance(opts.partialResponse)) {
        const r = result as { text?: string }
        if (r.text) {
          const cutPoint = Math.floor(random() * r.text.length * 0.7) + r.text.length * 0.1
          r.text = r.text.slice(0, cutPoint)
        }
      }

      return result
    },

    wrapStream: async ({ doStream, params }) => {
      if (opts.log) {
        console.log(`[${name}] wrapStream called`)
      }

      await applyAIChaos(opts)

      const result = (await doStream()) as { stream: ReadableStream }

      if (opts.streamCut || opts.slowTokens || opts.corruptChunks) {
        const originalStream = result.stream
        const transformer = new TransformStream({
          async transform(chunk, controller) {
            if (opts.slowTokens) {
              const delay = getDelay(opts.slowTokens)
              await sleep(delay)
            }

            if (chance(opts.corruptChunks)) {
              if (typeof chunk === "string") {
                const pos = Math.floor(random() * chunk.length)
                chunk = chunk.slice(0, pos) + "�" + chunk.slice(pos + 1)
              }
            }

            if (chance(opts.streamCut)) {
              controller.error(new StreamCutError())
              return
            }

            controller.enqueue(chunk)
          },
        })

        result.stream = originalStream.pipeThrough(transformer)
      }

      return result
    },
  }
}

function wrapProvider<T extends object>(provider: T, options: ProviderOptions = {}): T {
  return new Proxy(provider, {
    get(target, prop) {
      const value = Reflect.get(target, prop)

      if (typeof value === "function") {
        return (...args: unknown[]) => {
          const model = value.apply(target, args)
          const modelId = typeof args[0] === "string" ? args[0] : undefined
          const modelOpts = modelId && options.models?.[modelId]
          const mergedOpts = { ...options, ...modelOpts }

          return wrapModel(model, mergedOpts)
        }
      }

      return value
    },
  })
}

function wrapModel<T extends LanguageModelV1>(model: T, options: AISDKChaosOptions = {}): T {
  const originalDoGenerate = model.doGenerate.bind(model)
  const originalDoStream = model.doStream.bind(model)

  const wrappedModel = {
    ...model,
    doGenerate: async (params: unknown) => {
      await applyAIChaos(options, model.modelId)
      const result = await originalDoGenerate(params)

      if (chance(options.partialResponse)) {
        const r = result as { text?: string }
        if (r.text) {
          const cutPoint = Math.floor(random() * r.text.length * 0.7) + r.text.length * 0.1
          r.text = r.text.slice(0, cutPoint)
        }
      }

      return result
    },
    doStream: async (params: unknown) => {
      await applyAIChaos(options, model.modelId)
      const result = (await originalDoStream(params)) as { stream: ReadableStream }

      if (options.streamCut || options.slowTokens || options.corruptChunks) {
        const originalStream = result.stream
        const transformer = new TransformStream({
          async transform(chunk, controller) {
            if (options.slowTokens) {
              const delay = getDelay(options.slowTokens)
              await sleep(delay)
            }

            if (chance(options.corruptChunks)) {
              if (typeof chunk === "string") {
                const pos = Math.floor(random() * chunk.length)
                chunk = chunk.slice(0, pos) + "�" + chunk.slice(pos + 1)
              }
            }

            if (chance(options.streamCut)) {
              controller.error(new StreamCutError())
              return
            }

            controller.enqueue(chunk)
          },
        })

        result.stream = originalStream.pipeThrough(transformer)
      }

      return result
    },
  }

  return wrappedModel as T
}

function wrapTool<T extends (...args: unknown[]) => unknown>(
  tool: T,
  options: AISDKChaosOptions = {}
): T {
  return cruel(tool, {
    fail: options.toolFailure,
    timeout: options.toolTimeout,
    delay: options.delay,
  })
}

function wrapTools<T extends Record<string, unknown>>(
  tools: T,
  options: AISDKChaosOptions = {}
): T {
  const wrapped = {} as T

  for (const [name, tool] of Object.entries(tools)) {
    if (typeof tool === "object" && tool !== null && "execute" in tool) {
      const t = tool as { execute: (...args: unknown[]) => unknown }
      wrapped[name as keyof T] = {
        ...t,
        execute: wrapTool(t.execute as (...args: unknown[]) => unknown, options),
      } as T[keyof T]
    } else {
      wrapped[name as keyof T] = tool as T[keyof T]
    }
  }

  return wrapped
}

const presets = {
  realistic: {
    rateLimit: 0.02,
    overloaded: 0.01,
    delay: [50, 200] as [number, number],
    slowTokens: [20, 80] as [number, number],
  } as AISDKChaosOptions,

  unstable: {
    rateLimit: 0.1,
    overloaded: 0.05,
    streamCut: 0.05,
    delay: [100, 500] as [number, number],
    slowTokens: [50, 200] as [number, number],
  } as AISDKChaosOptions,

  harsh: {
    rateLimit: 0.2,
    overloaded: 0.1,
    streamCut: 0.1,
    contentFilter: 0.02,
    delay: [200, 1000] as [number, number],
    slowTokens: [100, 500] as [number, number],
  } as AISDKChaosOptions,

  nightmare: {
    rateLimit: 0.3,
    overloaded: 0.15,
    streamCut: 0.15,
    contentFilter: 0.05,
    contextLength: 0.05,
    partialResponse: 0.1,
    delay: [500, 2000] as [number, number],
    slowTokens: [200, 1000] as [number, number],
    toolFailure: 0.1,
  } as AISDKChaosOptions,

  apocalypse: {
    rateLimit: 0.4,
    overloaded: 0.2,
    streamCut: 0.2,
    contentFilter: 0.1,
    contextLength: 0.1,
    modelUnavailable: 0.1,
    partialResponse: 0.15,
    corruptChunks: 0.05,
    delay: [1000, 5000] as [number, number],
    slowTokens: [500, 2000] as [number, number],
    toolFailure: 0.2,
    toolTimeout: 0.1,
  } as AISDKChaosOptions,
}

const aisdk = {
  middleware: createChaosMiddleware,
  wrapProvider,
  wrapModel,
  wrapTool,
  wrapTools,
  presets,
  errors: {
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
  },
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
  type AISDKChaosOptions,
  type MiddlewareOptions,
  type ProviderOptions,
}
