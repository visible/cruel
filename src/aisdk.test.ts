import { describe, test, expect } from "bun:test"
import {
  aisdk,
  createChaosMiddleware,
  wrapModel,
  wrapTool,
  wrapTools,
  RateLimitError,
  OverloadedError,
  ContextLengthError,
  ContentFilterError,
  ModelUnavailableError,
  InvalidApiKeyError,
  QuotaExceededError,
  StreamCutError,
} from "./aisdk"

describe("aisdk.middleware", () => {
  test("creates middleware object", () => {
    const middleware = createChaosMiddleware()
    expect(middleware.transformParams).toBeDefined()
    expect(middleware.wrapGenerate).toBeDefined()
    expect(middleware.wrapStream).toBeDefined()
  })

  test("middleware with options", () => {
    const middleware = createChaosMiddleware({
      rateLimit: 0.1,
      name: "test-middleware",
      log: false,
    })
    expect(middleware).toBeDefined()
  })

  test("transformParams passes through", async () => {
    const middleware = createChaosMiddleware()
    const params = { prompt: "test" }
    const result = await middleware.transformParams!({ params })
    expect(result).toEqual(params)
  })

  test("wrapGenerate executes without chaos", async () => {
    const middleware = createChaosMiddleware({ fail: 0 })
    const doGenerate = async () => ({ text: "hello" })
    const result = await middleware.wrapGenerate!({ doGenerate, params: {} })
    expect(result).toEqual({ text: "hello" })
  })

  test("wrapGenerate throws on fail", async () => {
    const middleware = createChaosMiddleware({ fail: 1 })
    const doGenerate = async () => ({ text: "hello" })
    await expect(
      middleware.wrapGenerate!({ doGenerate, params: {} })
    ).rejects.toThrow()
  })

  test("wrapStream executes without chaos", async () => {
    const middleware = createChaosMiddleware({ fail: 0 })
    const stream = new ReadableStream()
    const doStream = async () => ({ stream })
    const result = await middleware.wrapStream!({ doStream, params: {} })
    expect(result).toHaveProperty("stream")
  })
})

describe("aisdk.wrapModel", () => {
  test("wraps model with chaos", async () => {
    const mockModel = {
      specificationVersion: "v1" as const,
      provider: "test",
      modelId: "test-model",
      doGenerate: async () => ({ text: "hello" }),
      doStream: async () => ({ stream: new ReadableStream() }),
    }

    const wrapped = wrapModel(mockModel, { fail: 0 })
    const result = await wrapped.doGenerate({})
    expect(result).toEqual({ text: "hello" })
  })

  test("wrapped model throws on rate limit", async () => {
    const mockModel = {
      specificationVersion: "v1" as const,
      provider: "test",
      modelId: "test-model",
      doGenerate: async () => ({ text: "hello" }),
      doStream: async () => ({ stream: new ReadableStream() }),
    }

    const wrapped = wrapModel(mockModel, { rateLimit: 1 })
    await expect(wrapped.doGenerate({})).rejects.toThrow(RateLimitError)
  })

  test("wrapped model throws on overloaded", async () => {
    const mockModel = {
      specificationVersion: "v1" as const,
      provider: "test",
      modelId: "test-model",
      doGenerate: async () => ({ text: "hello" }),
      doStream: async () => ({ stream: new ReadableStream() }),
    }

    const wrapped = wrapModel(mockModel, { overloaded: 1 })
    await expect(wrapped.doGenerate({})).rejects.toThrow(OverloadedError)
  })

  test("wrapped model throws on context length", async () => {
    const mockModel = {
      specificationVersion: "v1" as const,
      provider: "test",
      modelId: "test-model",
      doGenerate: async () => ({ text: "hello" }),
      doStream: async () => ({ stream: new ReadableStream() }),
    }

    const wrapped = wrapModel(mockModel, { contextLength: 1 })
    await expect(wrapped.doGenerate({})).rejects.toThrow(ContextLengthError)
  })

  test("wrapped model throws on content filter", async () => {
    const mockModel = {
      specificationVersion: "v1" as const,
      provider: "test",
      modelId: "test-model",
      doGenerate: async () => ({ text: "hello" }),
      doStream: async () => ({ stream: new ReadableStream() }),
    }

    const wrapped = wrapModel(mockModel, { contentFilter: 1 })
    await expect(wrapped.doGenerate({})).rejects.toThrow(ContentFilterError)
  })

  test("wrapped model throws on model unavailable", async () => {
    const mockModel = {
      specificationVersion: "v1" as const,
      provider: "test",
      modelId: "test-model",
      doGenerate: async () => ({ text: "hello" }),
      doStream: async () => ({ stream: new ReadableStream() }),
    }

    const wrapped = wrapModel(mockModel, { modelUnavailable: 1 })
    await expect(wrapped.doGenerate({})).rejects.toThrow(ModelUnavailableError)
  })

  test("wrapped model throws on invalid api key", async () => {
    const mockModel = {
      specificationVersion: "v1" as const,
      provider: "test",
      modelId: "test-model",
      doGenerate: async () => ({ text: "hello" }),
      doStream: async () => ({ stream: new ReadableStream() }),
    }

    const wrapped = wrapModel(mockModel, { invalidApiKey: 1 })
    await expect(wrapped.doGenerate({})).rejects.toThrow(InvalidApiKeyError)
  })

  test("wrapped model throws on quota exceeded", async () => {
    const mockModel = {
      specificationVersion: "v1" as const,
      provider: "test",
      modelId: "test-model",
      doGenerate: async () => ({ text: "hello" }),
      doStream: async () => ({ stream: new ReadableStream() }),
    }

    const wrapped = wrapModel(mockModel, { quotaExceeded: 1 })
    await expect(wrapped.doGenerate({})).rejects.toThrow(QuotaExceededError)
  })
})

describe("aisdk.wrapTool", () => {
  test("wraps tool function", async () => {
    const tool = async (input: string) => `processed: ${input}`
    const wrapped = wrapTool(tool, { fail: 0 })
    const result = await wrapped("test")
    expect(result).toBe("processed: test")
  })

  test("wrapped tool throws on failure", async () => {
    const tool = async (input: string) => `processed: ${input}`
    const wrapped = wrapTool(tool, { toolFailure: 1 })
    await expect(wrapped("test")).rejects.toThrow()
  })
})

describe("aisdk.wrapTools", () => {
  test("wraps tools object", () => {
    const tools = {
      search: {
        description: "Search the web",
        execute: async (query: string) => `results for: ${query}`,
      },
      calculate: {
        description: "Calculate expression",
        execute: async (expr: string) => `result: ${expr}`,
      },
    }

    const wrapped = wrapTools(tools, { fail: 0 })
    expect(wrapped.search).toBeDefined()
    expect(wrapped.calculate).toBeDefined()
  })
})

describe("aisdk.presets", () => {
  test("has realistic preset", () => {
    expect(aisdk.presets.realistic).toBeDefined()
    expect(aisdk.presets.realistic.rateLimit).toBe(0.02)
  })

  test("has unstable preset", () => {
    expect(aisdk.presets.unstable).toBeDefined()
    expect(aisdk.presets.unstable.rateLimit).toBe(0.1)
  })

  test("has harsh preset", () => {
    expect(aisdk.presets.harsh).toBeDefined()
    expect(aisdk.presets.harsh.rateLimit).toBe(0.2)
  })

  test("has nightmare preset", () => {
    expect(aisdk.presets.nightmare).toBeDefined()
    expect(aisdk.presets.nightmare.rateLimit).toBe(0.3)
  })

  test("has apocalypse preset", () => {
    expect(aisdk.presets.apocalypse).toBeDefined()
    expect(aisdk.presets.apocalypse.rateLimit).toBe(0.4)
  })
})

describe("aisdk.errors", () => {
  test("RateLimitError has correct properties", () => {
    const err = new RateLimitError(60)
    expect(err.code).toBe("rate_limit_exceeded")
    expect(err.statusCode).toBe(429)
    expect(err.retryAfter).toBe(60)
  })

  test("OverloadedError has correct properties", () => {
    const err = new OverloadedError()
    expect(err.code).toBe("overloaded")
    expect(err.statusCode).toBe(529)
  })

  test("ContextLengthError has correct properties", () => {
    const err = new ContextLengthError()
    expect(err.code).toBe("context_length_exceeded")
    expect(err.statusCode).toBe(400)
  })

  test("ContentFilterError has correct properties", () => {
    const err = new ContentFilterError()
    expect(err.code).toBe("content_filter")
    expect(err.statusCode).toBe(400)
  })

  test("ModelUnavailableError has correct properties", () => {
    const err = new ModelUnavailableError("gpt-4")
    expect(err.code).toBe("model_unavailable")
    expect(err.statusCode).toBe(503)
    expect(err.message).toContain("gpt-4")
  })

  test("InvalidApiKeyError has correct properties", () => {
    const err = new InvalidApiKeyError()
    expect(err.code).toBe("invalid_api_key")
    expect(err.statusCode).toBe(401)
  })

  test("QuotaExceededError has correct properties", () => {
    const err = new QuotaExceededError()
    expect(err.code).toBe("quota_exceeded")
    expect(err.statusCode).toBe(402)
  })

  test("StreamCutError has correct properties", () => {
    const err = new StreamCutError()
    expect(err.code).toBe("stream_interrupted")
    expect(err.statusCode).toBe(500)
  })
})
