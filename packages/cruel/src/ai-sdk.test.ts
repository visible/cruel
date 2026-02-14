import { describe, expect, test } from "bun:test"
import {
	CruelAPIError,
	cruelEmbeddingModel,
	cruelImageModel,
	cruelMiddleware,
	cruelModel,
	cruelProvider,
	cruelSpeechModel,
	cruelTool,
	cruelTools,
	cruelTranscriptionModel,
	cruelVideoModel,
	diagnostics,
	presets,
} from "./ai-sdk"
import type {
	ChaosEvent,
	EmbeddingModelV3,
	EmbeddingModelV3Result,
	ImageModelV3,
	ImageModelV3Result,
	LanguageModelV3,
	LanguageModelV3CallOptions,
	LanguageModelV3GenerateResult,
	LanguageModelV3StreamPart,
	LanguageModelV3Usage,
	ProviderV3,
	SpeechModelV3,
	SpeechModelV3Result,
	TranscriptionModelV3,
	TranscriptionModelV3Result,
	VideoModelV3,
	VideoModelV3Result,
} from "./types"

const MOCK_USAGE: LanguageModelV3Usage = {
	inputTokens: { total: 100, noCache: 80, cacheRead: 20, cacheWrite: undefined },
	outputTokens: { total: 50, text: 45, reasoning: 5 },
}

const MOCK_RESULT: LanguageModelV3GenerateResult = {
	content: [{ type: "text", text: "hello world this is a test response" }],
	finishReason: { unified: "stop", raw: undefined },
	usage: MOCK_USAGE,
	warnings: [],
}

const TEST_PARAMS: LanguageModelV3CallOptions = {
	prompt: [{ role: "user", content: [{ type: "text", text: "hello" }] }],
}

function contentText(result: LanguageModelV3GenerateResult): string {
	for (const item of result.content) {
		if (item.type === "text") return item.text
	}
	return ""
}

function createMockStream(
	parts: LanguageModelV3StreamPart[],
): ReadableStream<LanguageModelV3StreamPart> {
	return new ReadableStream({
		start(controller) {
			for (const part of parts) {
				controller.enqueue(part)
			}
			controller.close()
		},
	})
}

function createMockModel(overrides?: Partial<LanguageModelV3>): LanguageModelV3 {
	return {
		specificationVersion: "v3",
		provider: "test",
		modelId: "test-model",
		supportedUrls: {},
		doGenerate: async () => MOCK_RESULT,
		doStream: async () => ({
			stream: createMockStream([
				{ type: "text-delta", id: "t1", delta: "hello" },
				{ type: "text-delta", id: "t1", delta: " world" },
				{
					type: "finish",
					finishReason: { unified: "stop", raw: undefined },
					usage: MOCK_USAGE,
				},
			]),
		}),
		...overrides,
	}
}

async function collectStream(
	stream: ReadableStream<LanguageModelV3StreamPart>,
): Promise<LanguageModelV3StreamPart[]> {
	const reader = stream.getReader()
	const chunks: LanguageModelV3StreamPart[] = []
	while (true) {
		const { done, value } = await reader.read()
		if (done) break
		chunks.push(value)
	}
	return chunks
}

describe("cruelModel", () => {
	test("passes through without chaos", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model)
		const result = await wrapped.doGenerate(TEST_PARAMS)
		expect(contentText(result)).toBe("hello world this is a test response")
		expect(result.finishReason.unified).toBe("stop")
	})

	test("preserves model properties", () => {
		const model = createMockModel()
		const wrapped = cruelModel(model)
		expect(wrapped.specificationVersion).toBe("v3")
		expect(wrapped.provider).toBe("test")
		expect(wrapped.modelId).toBe("test-model")
	})

	test("throws on rateLimit=1", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model, { rateLimit: 1 })
		try {
			await wrapped.doGenerate(TEST_PARAMS)
			expect(true).toBe(false)
		} catch (e) {
			expect(e).toBeInstanceOf(CruelAPIError)
			const err = e as CruelAPIError
			expect(err.statusCode).toBe(429)
			expect(err.isRetryable).toBe(true)
			expect(err.name).toBe("AI_APICallError")
		}
	})

	test("no error on rateLimit=0", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model, { rateLimit: 0 })
		const result = await wrapped.doGenerate(TEST_PARAMS)
		expect(contentText(result)).toBe("hello world this is a test response")
	})

	test("throws on overloaded=1", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model, { overloaded: 1 })
		try {
			await wrapped.doGenerate(TEST_PARAMS)
			expect(true).toBe(false)
		} catch (e) {
			const err = e as CruelAPIError
			expect(err.statusCode).toBe(529)
			expect(err.isRetryable).toBe(true)
		}
	})

	test("throws on contextLength=1", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model, { contextLength: 1 })
		try {
			await wrapped.doGenerate(TEST_PARAMS)
			expect(true).toBe(false)
		} catch (e) {
			const err = e as CruelAPIError
			expect(err.statusCode).toBe(400)
			expect(err.isRetryable).toBe(false)
		}
	})

	test("throws on contentFilter=1", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model, { contentFilter: 1 })
		try {
			await wrapped.doGenerate(TEST_PARAMS)
			expect(true).toBe(false)
		} catch (e) {
			const err = e as CruelAPIError
			expect(err.statusCode).toBe(400)
			expect(err.isRetryable).toBe(false)
		}
	})

	test("throws on modelUnavailable=1", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model, { modelUnavailable: 1 })
		try {
			await wrapped.doGenerate(TEST_PARAMS)
			expect(true).toBe(false)
		} catch (e) {
			const err = e as CruelAPIError
			expect(err.statusCode).toBe(503)
			expect(err.isRetryable).toBe(true)
		}
	})

	test("throws on invalidApiKey=1", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model, { invalidApiKey: 1 })
		try {
			await wrapped.doGenerate(TEST_PARAMS)
			expect(true).toBe(false)
		} catch (e) {
			const err = e as CruelAPIError
			expect(err.statusCode).toBe(401)
			expect(err.isRetryable).toBe(false)
		}
	})

	test("throws on quotaExceeded=1", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model, { quotaExceeded: 1 })
		try {
			await wrapped.doGenerate(TEST_PARAMS)
			expect(true).toBe(false)
		} catch (e) {
			const err = e as CruelAPIError
			expect(err.statusCode).toBe(402)
			expect(err.isRetryable).toBe(false)
		}
	})

	test("throws on emptyResponse=1", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model, { emptyResponse: 1 })
		try {
			await wrapped.doGenerate(TEST_PARAMS)
			expect(true).toBe(false)
		} catch (e) {
			const err = e as CruelAPIError
			expect(err.statusCode).toBe(200)
			expect(err.isRetryable).toBe(false)
		}
	})

	test("partialResponse truncates text", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model, { partialResponse: 1 })
		const result = await wrapped.doGenerate(TEST_PARAMS)
		const t = contentText(result)
		expect(t.length).toBeLessThan("hello world this is a test response".length)
		expect(t.length).toBeGreaterThan(0)
	})

	test("no truncation on partialResponse=0", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model, { partialResponse: 0 })
		const result = await wrapped.doGenerate(TEST_PARAMS)
		expect(contentText(result)).toBe("hello world this is a test response")
	})

	test("finishReason override", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model, { finishReason: "length" })
		const result = await wrapped.doGenerate(TEST_PARAMS)
		expect(result.finishReason.unified).toBe("length")
	})

	test("tokenUsage override in doGenerate", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model, { tokenUsage: { inputTokens: 999, outputTokens: 888 } })
		const result = await wrapped.doGenerate(TEST_PARAMS)
		expect(result.usage.inputTokens.total).toBe(999)
		expect(result.usage.outputTokens.total).toBe(888)
	})

	test("doStream passes through without chaos", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model)
		const result = await wrapped.doStream(TEST_PARAMS)
		const chunks = await collectStream(result.stream)
		expect(chunks).toHaveLength(3)
	})

	test("doStream passes stream-start through", async () => {
		const model = createMockModel({
			doStream: async () => ({
				stream: createMockStream([
					{ type: "stream-start", warnings: [{ type: "other", message: "test warning" }] },
					{ type: "text-delta", id: "t1", delta: "hi" },
					{
						type: "finish",
						finishReason: { unified: "stop", raw: undefined },
						usage: MOCK_USAGE,
					},
				]),
			}),
		})
		const wrapped = cruelModel(model)
		const result = await wrapped.doStream(TEST_PARAMS)
		const chunks = await collectStream(result.stream)
		const start = chunks.find((c) => c.type === "stream-start")
		expect(start).toBeDefined()
		if (start?.type === "stream-start") {
			expect(start.warnings).toHaveLength(1)
			expect(start.warnings[0]).toEqual({ type: "other", message: "test warning" })
		}
	})

	test("doStream throws on rateLimit=1", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model, { rateLimit: 1 })
		try {
			await wrapped.doStream(TEST_PARAMS)
			expect(true).toBe(false)
		} catch (e) {
			expect((e as CruelAPIError).statusCode).toBe(429)
		}
	})

	test("streamCut errors mid-stream", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model, { streamCut: 1 })
		const result = await wrapped.doStream(TEST_PARAMS)
		try {
			await collectStream(result.stream)
			expect(true).toBe(false)
		} catch (e) {
			expect(e).toBeInstanceOf(CruelAPIError)
			expect((e as CruelAPIError).statusCode).toBe(500)
		}
	})

	test("no streamCut on rate=0", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model, { streamCut: 0 })
		const result = await wrapped.doStream(TEST_PARAMS)
		const chunks = await collectStream(result.stream)
		expect(chunks).toHaveLength(3)
	})

	test("corruptChunks modifies text-delta", async () => {
		const model = createMockModel({
			doStream: async () => ({
				stream: createMockStream([
					{ type: "text-delta", id: "t1", delta: "hello world" },
					{
						type: "finish",
						finishReason: { unified: "stop", raw: undefined },
						usage: MOCK_USAGE,
					},
				]),
			}),
		})
		const wrapped = cruelModel(model, { corruptChunks: 1 })
		const result = await wrapped.doStream(TEST_PARAMS)
		const chunks = await collectStream(result.stream)
		const textChunk = chunks.find((c) => c.type === "text-delta")
		expect(textChunk).toBeDefined()
		if (textChunk?.type === "text-delta") {
			expect(textChunk.delta).toContain("\uFFFD")
		}
	})

	test("corruptChunks does not modify non-text chunks", async () => {
		const model = createMockModel({
			doStream: async () => ({
				stream: createMockStream([
					{
						type: "tool-call",
						toolCallId: "c1",
						toolName: "search",
						input: '{"q":"test"}',
					},
					{
						type: "finish",
						finishReason: { unified: "stop", raw: undefined },
						usage: MOCK_USAGE,
					},
				]),
			}),
		})
		const wrapped = cruelModel(model, { corruptChunks: 1 })
		const result = await wrapped.doStream(TEST_PARAMS)
		const chunks = await collectStream(result.stream)
		const toolChunk = chunks.find((c) => c.type === "tool-call")
		if (toolChunk?.type === "tool-call") {
			expect(toolChunk.input).toBe('{"q":"test"}')
		}
	})

	test("finishReason override in stream", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model, { finishReason: "error" })
		const result = await wrapped.doStream(TEST_PARAMS)
		const chunks = await collectStream(result.stream)
		const finish = chunks.find((c) => c.type === "finish")
		if (finish?.type === "finish") {
			expect(finish.finishReason.unified).toBe("error")
		}
	})

	test("tokenUsage override in stream", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model, { tokenUsage: { inputTokens: 777 } })
		const result = await wrapped.doStream(TEST_PARAMS)
		const chunks = await collectStream(result.stream)
		const finish = chunks.find((c) => c.type === "finish")
		if (finish?.type === "finish") {
			expect(finish.usage.inputTokens.total).toBe(777)
			expect(finish.usage.outputTokens.total).toBe(50)
		}
	})
})

describe("cruelProvider", () => {
	test("wraps provider.languageModel calls", async () => {
		const model = createMockModel()
		const provider: ProviderV3 = {
			specificationVersion: "v3",
			languageModel: () => model,
			embeddingModel: () => createMockEmbeddingModel(),
			imageModel: () => createMockImageModel(),
		}
		const wrapped = cruelProvider(provider)
		const wrappedModel = wrapped.languageModel("test-model")
		const result = await wrappedModel.doGenerate(TEST_PARAMS)
		expect(contentText(result)).toBe("hello world this is a test response")
	})

	test("applies chaos to provider models", async () => {
		const model = createMockModel()
		const provider: ProviderV3 = {
			specificationVersion: "v3",
			languageModel: () => model,
			embeddingModel: () => createMockEmbeddingModel(),
			imageModel: () => createMockImageModel(),
		}
		const wrapped = cruelProvider(provider, { rateLimit: 1 })
		const wrappedModel = wrapped.languageModel("test-model")
		try {
			await wrappedModel.doGenerate(TEST_PARAMS)
			expect(true).toBe(false)
		} catch (e) {
			expect((e as CruelAPIError).statusCode).toBe(429)
		}
	})

	test("applies per-model options", async () => {
		const model = createMockModel()
		const provider: ProviderV3 = {
			specificationVersion: "v3",
			languageModel: () => model,
			embeddingModel: () => createMockEmbeddingModel(),
			imageModel: () => createMockImageModel(),
		}
		const wrapped = cruelProvider(provider, {
			models: { "test-model": { rateLimit: 1 } },
		})
		const wrappedModel = wrapped.languageModel("test-model")
		try {
			await wrappedModel.doGenerate(TEST_PARAMS)
			expect(true).toBe(false)
		} catch (e) {
			expect((e as CruelAPIError).statusCode).toBe(429)
		}
	})

	test("preserves non-function properties", () => {
		const model = createMockModel()
		const provider: ProviderV3 = {
			specificationVersion: "v3",
			languageModel: () => model,
			embeddingModel: () => createMockEmbeddingModel(),
			imageModel: () => createMockImageModel(),
		}
		const wrapped = cruelProvider(provider)
		expect(wrapped.specificationVersion).toBe("v3")
	})

	test("wraps embeddingModel with cruelEmbeddingModel", async () => {
		const provider: ProviderV3 = {
			specificationVersion: "v3",
			languageModel: () => createMockModel(),
			embeddingModel: () => createMockEmbeddingModel(),
			imageModel: () => createMockImageModel(),
		}
		const wrapped = cruelProvider(provider, { rateLimit: 1 })
		const embedding = wrapped.embeddingModel("test-embed")
		try {
			await embedding.doEmbed({ values: ["test"] })
			expect(true).toBe(false)
		} catch (e) {
			expect((e as CruelAPIError).statusCode).toBe(429)
		}
	})

	test("wraps imageModel with cruelImageModel", async () => {
		const provider: ProviderV3 = {
			specificationVersion: "v3",
			languageModel: () => createMockModel(),
			embeddingModel: () => createMockEmbeddingModel(),
			imageModel: () => createMockImageModel(),
		}
		const wrapped = cruelProvider(provider, { rateLimit: 1 })
		const image = wrapped.imageModel("test-image")
		try {
			await image.doGenerate({
				prompt: "test",
				n: 1,
				size: undefined,
				aspectRatio: undefined,
				seed: undefined,
				files: undefined,
				mask: undefined,
				providerOptions: {},
			})
			expect(true).toBe(false)
		} catch (e) {
			expect((e as CruelAPIError).statusCode).toBe(429)
		}
	})
})

describe("cruelMiddleware", () => {
	test("returns wrapGenerate and wrapStream", () => {
		const mw = cruelMiddleware()
		expect(mw.wrapGenerate).toBeDefined()
		expect(mw.wrapStream).toBeDefined()
	})

	test("has specificationVersion v3", () => {
		const mw = cruelMiddleware()
		expect(mw.specificationVersion).toBe("v3")
	})

	test("wrapGenerate passes through", async () => {
		const mw = cruelMiddleware()
		const model = createMockModel()
		const generate = mw.wrapGenerate
		if (!generate) throw new Error("missing wrapGenerate")
		const result = await generate({
			doGenerate: async () => MOCK_RESULT,
			doStream: async () => ({
				stream: createMockStream([]),
			}),
			params: TEST_PARAMS,
			model,
		})
		expect(contentText(result)).toBe("hello world this is a test response")
	})

	test("wrapGenerate throws on chaos", async () => {
		const mw = cruelMiddleware({ rateLimit: 1 })
		const model = createMockModel()
		const generate = mw.wrapGenerate
		if (!generate) throw new Error("missing wrapGenerate")
		try {
			await generate({
				doGenerate: async () => MOCK_RESULT,
				doStream: async () => ({
					stream: createMockStream([]),
				}),
				params: TEST_PARAMS,
				model,
			})
			expect(true).toBe(false)
		} catch (e) {
			expect((e as CruelAPIError).statusCode).toBe(429)
		}
	})

	test("wrapStream passes through", async () => {
		const mw = cruelMiddleware()
		const model = createMockModel()
		const wrap = mw.wrapStream
		if (!wrap) throw new Error("missing wrapStream")
		const result = await wrap({
			doGenerate: async () => MOCK_RESULT,
			doStream: async () => ({
				stream: createMockStream([
					{ type: "text-delta", id: "t1", delta: "hi" },
					{
						type: "finish",
						finishReason: { unified: "stop", raw: undefined },
						usage: MOCK_USAGE,
					},
				]),
			}),
			params: TEST_PARAMS,
			model,
		})
		const chunks = await collectStream(result.stream)
		expect(chunks).toHaveLength(2)
	})
})

describe("cruelTool", () => {
	test("passes through without chaos", async () => {
		const tool = {
			description: "test tool",
			execute: async (input: string) => `result: ${input}`,
		}
		const wrapped = cruelTool(tool)
		const result = await wrapped.execute("hello")
		expect(result).toBe("result: hello")
	})

	test("throws on toolFailure=1", async () => {
		const tool = {
			description: "test tool",
			execute: async (input: string) => `result: ${input}`,
		}
		const wrapped = cruelTool(tool, { toolFailure: 1 })
		await expect(wrapped.execute("hello")).rejects.toThrow("Tool execution failed")
	})

	test("no failure on toolFailure=0", async () => {
		const tool = {
			description: "test tool",
			execute: async (input: string) => `result: ${input}`,
		}
		const wrapped = cruelTool(tool, { toolFailure: 0 })
		const result = await wrapped.execute("hello")
		expect(result).toBe("result: hello")
	})

	test("preserves tool properties", () => {
		const tool = {
			description: "test tool",
			inputSchema: { type: "object" },
			execute: async () => "ok",
		}
		const wrapped = cruelTool(tool)
		expect(wrapped.description).toBe("test tool")
		expect(wrapped.inputSchema).toEqual({ type: "object" })
	})
})

describe("cruelTools", () => {
	test("wraps all tools", async () => {
		const tools = {
			search: {
				description: "search",
				execute: async (q: string) => `found: ${q}`,
			},
			calc: {
				description: "calc",
				execute: async (expr: string) => `result: ${expr}`,
			},
		}
		const wrapped = cruelTools(tools)
		const searchResult = await wrapped.search.execute("hello")
		expect(searchResult).toBe("found: hello")
		const calcResult = await wrapped.calc.execute("1+1")
		expect(calcResult).toBe("result: 1+1")
	})

	test("applies chaos to all tools", async () => {
		const tools = {
			search: {
				description: "search",
				execute: async () => "ok",
			},
		}
		const wrapped = cruelTools(tools, { toolFailure: 1 })
		await expect(wrapped.search.execute()).rejects.toThrow()
	})
})

describe("presets", () => {
	test("realistic", () => {
		expect(presets.realistic.rateLimit).toBe(0.02)
		expect(presets.realistic.overloaded).toBe(0.01)
	})

	test("unstable", () => {
		expect(presets.unstable.rateLimit).toBe(0.1)
		expect(presets.unstable.streamCut).toBe(0.05)
	})

	test("harsh", () => {
		expect(presets.harsh.rateLimit).toBe(0.2)
		expect(presets.harsh.contentFilter).toBe(0.02)
	})

	test("nightmare", () => {
		expect(presets.nightmare.rateLimit).toBe(0.3)
		expect(presets.nightmare.toolFailure).toBe(0.1)
	})

	test("apocalypse", () => {
		expect(presets.apocalypse.rateLimit).toBe(0.4)
		expect(presets.apocalypse.modelUnavailable).toBe(0.1)
		expect(presets.apocalypse.corruptChunks).toBe(0.05)
	})
})

describe("CruelAPIError", () => {
	test("has correct name", () => {
		const err = new CruelAPIError({ message: "test", statusCode: 500 })
		expect(err.name).toBe("AI_APICallError")
	})

	test("auto-computes isRetryable for 429", () => {
		const err = new CruelAPIError({ message: "test", statusCode: 429 })
		expect(err.isRetryable).toBe(true)
	})

	test("auto-computes isRetryable for 529", () => {
		const err = new CruelAPIError({ message: "test", statusCode: 529 })
		expect(err.isRetryable).toBe(true)
	})

	test("auto-computes isRetryable for 500", () => {
		const err = new CruelAPIError({ message: "test", statusCode: 500 })
		expect(err.isRetryable).toBe(true)
	})

	test("not retryable for 400", () => {
		const err = new CruelAPIError({ message: "test", statusCode: 400 })
		expect(err.isRetryable).toBe(false)
	})

	test("not retryable for 401", () => {
		const err = new CruelAPIError({ message: "test", statusCode: 401 })
		expect(err.isRetryable).toBe(false)
	})

	test("has url and requestBodyValues", () => {
		const err = new CruelAPIError({ message: "test", statusCode: 500 })
		expect(err.url).toBe("https://api.cruel.dev/chaos")
		expect(err.requestBodyValues).toEqual({})
	})

	test("supports data field", () => {
		const err = new CruelAPIError({ message: "test", statusCode: 429, data: { retryAfter: 60 } })
		expect(err.data).toEqual({ retryAfter: 60 })
	})

	test("respects explicit isRetryable override", () => {
		const err = new CruelAPIError({ message: "test", statusCode: 500, isRetryable: false })
		expect(err.isRetryable).toBe(false)
	})
})

const MOCK_EMBED_RESULT: EmbeddingModelV3Result = {
	embeddings: [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]],
	usage: { tokens: 10 },
	warnings: [],
}

function createMockEmbeddingModel(
	overrides?: Partial<EmbeddingModelV3>,
): EmbeddingModelV3 {
	return {
		specificationVersion: "v3",
		provider: "test",
		modelId: "test-embedding",
		maxEmbeddingsPerCall: 100,
		supportsParallelCalls: true,
		doEmbed: async () => MOCK_EMBED_RESULT,
		...overrides,
	}
}

describe("cruelEmbeddingModel", () => {
	test("passes through without chaos", async () => {
		const model = createMockEmbeddingModel()
		const wrapped = cruelEmbeddingModel(model)
		const result = await wrapped.doEmbed({ values: ["hello"] })
		expect(result.embeddings).toEqual([[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]])
		expect(result.usage).toEqual({ tokens: 10 })
	})

	test("preserves model properties", () => {
		const model = createMockEmbeddingModel()
		const wrapped = cruelEmbeddingModel(model)
		expect(wrapped.specificationVersion).toBe("v3")
		expect(wrapped.provider).toBe("test")
		expect(wrapped.modelId).toBe("test-embedding")
		expect(wrapped.maxEmbeddingsPerCall).toBe(100)
		expect(wrapped.supportsParallelCalls).toBe(true)
	})

	test("throws on rateLimit=1", async () => {
		const model = createMockEmbeddingModel()
		const wrapped = cruelEmbeddingModel(model, { rateLimit: 1 })
		try {
			await wrapped.doEmbed({ values: ["hello"] })
			expect(true).toBe(false)
		} catch (e) {
			expect(e).toBeInstanceOf(CruelAPIError)
			expect((e as CruelAPIError).statusCode).toBe(429)
		}
	})

	test("no error on rateLimit=0", async () => {
		const model = createMockEmbeddingModel()
		const wrapped = cruelEmbeddingModel(model, { rateLimit: 0 })
		const result = await wrapped.doEmbed({ values: ["hello"] })
		expect(result.embeddings).toHaveLength(2)
	})

	test("throws on overloaded=1", async () => {
		const model = createMockEmbeddingModel()
		const wrapped = cruelEmbeddingModel(model, { overloaded: 1 })
		try {
			await wrapped.doEmbed({ values: ["hello"] })
			expect(true).toBe(false)
		} catch (e) {
			expect((e as CruelAPIError).statusCode).toBe(529)
		}
	})

	test("throws on invalidApiKey=1", async () => {
		const model = createMockEmbeddingModel()
		const wrapped = cruelEmbeddingModel(model, { invalidApiKey: 1 })
		try {
			await wrapped.doEmbed({ values: ["hello"] })
			expect(true).toBe(false)
		} catch (e) {
			expect((e as CruelAPIError).statusCode).toBe(401)
			expect((e as CruelAPIError).isRetryable).toBe(false)
		}
	})

	test("throws on quotaExceeded=1", async () => {
		const model = createMockEmbeddingModel()
		const wrapped = cruelEmbeddingModel(model, { quotaExceeded: 1 })
		try {
			await wrapped.doEmbed({ values: ["hello"] })
			expect(true).toBe(false)
		} catch (e) {
			expect((e as CruelAPIError).statusCode).toBe(402)
		}
	})

	test("throws on fail=1", async () => {
		const model = createMockEmbeddingModel()
		const wrapped = cruelEmbeddingModel(model, { fail: 1 })
		try {
			await wrapped.doEmbed({ values: ["hello"] })
			expect(true).toBe(false)
		} catch (e) {
			expect((e as CruelAPIError).statusCode).toBe(500)
		}
	})
})

const MOCK_IMAGE_RESULT: ImageModelV3Result = {
	images: ["base64data1", "base64data2"],
	warnings: [],
	response: { timestamp: new Date(), modelId: "test-image", headers: undefined },
}

function createMockImageModel(overrides?: Partial<ImageModelV3>): ImageModelV3 {
	return {
		specificationVersion: "v3",
		provider: "test",
		modelId: "test-image",
		maxImagesPerCall: 4,
		doGenerate: async () => MOCK_IMAGE_RESULT,
		...overrides,
	}
}

describe("cruelImageModel", () => {
	test("passes through without chaos", async () => {
		const model = createMockImageModel()
		const wrapped = cruelImageModel(model)
		const result = await wrapped.doGenerate({
			prompt: "a cat", n: 1, size: undefined, aspectRatio: undefined,
			seed: undefined, files: undefined, mask: undefined, providerOptions: {},
		})
		expect(result.images).toEqual(["base64data1", "base64data2"])
	})

	test("preserves model properties", () => {
		const model = createMockImageModel()
		const wrapped = cruelImageModel(model)
		expect(wrapped.specificationVersion).toBe("v3")
		expect(wrapped.modelId).toBe("test-image")
		expect(wrapped.maxImagesPerCall).toBe(4)
	})

	test("throws on rateLimit=1", async () => {
		const model = createMockImageModel()
		const wrapped = cruelImageModel(model, { rateLimit: 1 })
		try {
			await wrapped.doGenerate({
				prompt: "a cat", n: 1, size: undefined, aspectRatio: undefined,
				seed: undefined, files: undefined, mask: undefined, providerOptions: {},
			})
			expect(true).toBe(false)
		} catch (e) {
			expect((e as CruelAPIError).statusCode).toBe(429)
		}
	})

	test("no error on rateLimit=0", async () => {
		const model = createMockImageModel()
		const wrapped = cruelImageModel(model, { rateLimit: 0 })
		const result = await wrapped.doGenerate({
			prompt: "a cat", n: 1, size: undefined, aspectRatio: undefined,
			seed: undefined, files: undefined, mask: undefined, providerOptions: {},
		})
		expect(result.images).toHaveLength(2)
	})
})

const MOCK_SPEECH_RESULT: SpeechModelV3Result = {
	audio: "audiodata",
	warnings: [],
	response: { timestamp: new Date(), modelId: "test-speech", headers: undefined, body: undefined },
}

function createMockSpeechModel(overrides?: Partial<SpeechModelV3>): SpeechModelV3 {
	return {
		specificationVersion: "v3",
		provider: "test",
		modelId: "test-speech",
		doGenerate: async () => MOCK_SPEECH_RESULT,
		...overrides,
	}
}

describe("cruelSpeechModel", () => {
	test("passes through without chaos", async () => {
		const model = createMockSpeechModel()
		const wrapped = cruelSpeechModel(model)
		const result = await wrapped.doGenerate({ text: "hello" })
		expect(result.audio).toBe("audiodata")
	})

	test("throws on rateLimit=1", async () => {
		const model = createMockSpeechModel()
		const wrapped = cruelSpeechModel(model, { rateLimit: 1 })
		try {
			await wrapped.doGenerate({ text: "hello" })
			expect(true).toBe(false)
		} catch (e) {
			expect((e as CruelAPIError).statusCode).toBe(429)
		}
	})

	test("no error on rateLimit=0", async () => {
		const model = createMockSpeechModel()
		const wrapped = cruelSpeechModel(model, { rateLimit: 0 })
		const result = await wrapped.doGenerate({ text: "hello" })
		expect(result.audio).toBe("audiodata")
	})
})

const MOCK_TRANSCRIPTION_RESULT: TranscriptionModelV3Result = {
	text: "hello world",
	segments: [{ text: "hello world", startSecond: 0, endSecond: 1.5 }],
	language: "en",
	durationInSeconds: 1.5,
	warnings: [],
	response: { timestamp: new Date(), modelId: "test-transcription", headers: undefined, body: undefined },
}

function createMockTranscriptionModel(
	overrides?: Partial<TranscriptionModelV3>,
): TranscriptionModelV3 {
	return {
		specificationVersion: "v3",
		provider: "test",
		modelId: "test-transcription",
		doGenerate: async () => MOCK_TRANSCRIPTION_RESULT,
		...overrides,
	}
}

describe("cruelTranscriptionModel", () => {
	test("passes through without chaos", async () => {
		const model = createMockTranscriptionModel()
		const wrapped = cruelTranscriptionModel(model)
		const result = await wrapped.doGenerate({
			audio: new Uint8Array([1, 2, 3]), mediaType: "audio/mp3",
		})
		expect(result.text).toBe("hello world")
		expect(result.segments).toHaveLength(1)
	})

	test("throws on rateLimit=1", async () => {
		const model = createMockTranscriptionModel()
		const wrapped = cruelTranscriptionModel(model, { rateLimit: 1 })
		try {
			await wrapped.doGenerate({
				audio: new Uint8Array([1, 2, 3]), mediaType: "audio/mp3",
			})
			expect(true).toBe(false)
		} catch (e) {
			expect((e as CruelAPIError).statusCode).toBe(429)
		}
	})

	test("no error on rateLimit=0", async () => {
		const model = createMockTranscriptionModel()
		const wrapped = cruelTranscriptionModel(model, { rateLimit: 0 })
		const result = await wrapped.doGenerate({
			audio: new Uint8Array([1, 2, 3]), mediaType: "audio/mp3",
		})
		expect(result.text).toBe("hello world")
	})
})

const MOCK_VIDEO_RESULT: VideoModelV3Result = {
	videos: [{ type: "url", url: "https://example.com/video.mp4", mediaType: "video/mp4" }],
	warnings: [],
	response: { timestamp: new Date(), modelId: "test-video", headers: undefined },
}

function createMockVideoModel(overrides?: Partial<VideoModelV3>): VideoModelV3 {
	return {
		specificationVersion: "v3",
		provider: "test",
		modelId: "test-video",
		maxVideosPerCall: 1,
		doGenerate: async () => MOCK_VIDEO_RESULT,
		...overrides,
	}
}

describe("cruelVideoModel", () => {
	test("passes through without chaos", async () => {
		const model = createMockVideoModel()
		const wrapped = cruelVideoModel(model)
		const result = await wrapped.doGenerate({
			prompt: "a cat walking", n: 1, aspectRatio: undefined,
			resolution: undefined, duration: undefined, fps: undefined,
			seed: undefined, image: undefined, providerOptions: {},
		})
		expect(result.videos).toHaveLength(1)
		expect(result.videos[0].type).toBe("url")
	})

	test("preserves model properties", () => {
		const model = createMockVideoModel()
		const wrapped = cruelVideoModel(model)
		expect(wrapped.specificationVersion).toBe("v3")
		expect(wrapped.modelId).toBe("test-video")
		expect(wrapped.maxVideosPerCall).toBe(1)
	})

	test("throws on rateLimit=1", async () => {
		const model = createMockVideoModel()
		const wrapped = cruelVideoModel(model, { rateLimit: 1 })
		try {
			await wrapped.doGenerate({
				prompt: "a cat walking", n: 1, aspectRatio: undefined,
				resolution: undefined, duration: undefined, fps: undefined,
				seed: undefined, image: undefined, providerOptions: {},
			})
			expect(true).toBe(false)
		} catch (e) {
			expect((e as CruelAPIError).statusCode).toBe(429)
		}
	})

	test("no error on rateLimit=0", async () => {
		const model = createMockVideoModel()
		const wrapped = cruelVideoModel(model, { rateLimit: 0 })
		const result = await wrapped.doGenerate({
			prompt: "a cat walking", n: 1, aspectRatio: undefined,
			resolution: undefined, duration: undefined, fps: undefined,
			seed: undefined, image: undefined, providerOptions: {},
		})
		expect(result.videos).toHaveLength(1)
	})
})

describe("onChaos", () => {
	function collect() {
		const events: ChaosEvent[] = []
		const onChaos = (e: ChaosEvent) => events.push(e)
		return { events, onChaos }
	}

	test("not called when no chaos fires", async () => {
		const { events, onChaos } = collect()
		const model = createMockModel()
		const wrapped = cruelModel(model, {
			rateLimit: 0,
			streamCut: 0,
			onChaos,
		})
		await wrapped.doGenerate(TEST_PARAMS)
		expect(events).toHaveLength(0)
	})

	test("not called when no options", async () => {
		const model = createMockModel()
		const wrapped = cruelModel(model)
		const result = await wrapped.doGenerate(TEST_PARAMS)
		expect(contentText(result)).toBe("hello world this is a test response")
	})

	describe("applyChaos errors", () => {
		test("rateLimit", async () => {
			const { events, onChaos } = collect()
			const wrapped = cruelModel(createMockModel(), { rateLimit: 1, onChaos })
			try { await wrapped.doGenerate(TEST_PARAMS) } catch {}
			expect(events).toEqual([{ type: "rateLimit", modelId: "test-model" }])
		})

		test("overloaded", async () => {
			const { events, onChaos } = collect()
			const wrapped = cruelModel(createMockModel(), { overloaded: 1, onChaos })
			try { await wrapped.doGenerate(TEST_PARAMS) } catch {}
			expect(events).toEqual([{ type: "overloaded", modelId: "test-model" }])
		})

		test("contextLength", async () => {
			const { events, onChaos } = collect()
			const wrapped = cruelModel(createMockModel(), { contextLength: 1, onChaos })
			try { await wrapped.doGenerate(TEST_PARAMS) } catch {}
			expect(events).toEqual([{ type: "contextLength", modelId: "test-model" }])
		})

		test("contentFilter", async () => {
			const { events, onChaos } = collect()
			const wrapped = cruelModel(createMockModel(), { contentFilter: 1, onChaos })
			try { await wrapped.doGenerate(TEST_PARAMS) } catch {}
			expect(events).toEqual([{ type: "contentFilter", modelId: "test-model" }])
		})

		test("modelUnavailable", async () => {
			const { events, onChaos } = collect()
			const wrapped = cruelModel(createMockModel(), { modelUnavailable: 1, onChaos })
			try { await wrapped.doGenerate(TEST_PARAMS) } catch {}
			expect(events).toEqual([{ type: "modelUnavailable", modelId: "test-model" }])
		})

		test("invalidApiKey", async () => {
			const { events, onChaos } = collect()
			const wrapped = cruelModel(createMockModel(), { invalidApiKey: 1, onChaos })
			try { await wrapped.doGenerate(TEST_PARAMS) } catch {}
			expect(events).toEqual([{ type: "invalidApiKey", modelId: "test-model" }])
		})

		test("quotaExceeded", async () => {
			const { events, onChaos } = collect()
			const wrapped = cruelModel(createMockModel(), { quotaExceeded: 1, onChaos })
			try { await wrapped.doGenerate(TEST_PARAMS) } catch {}
			expect(events).toEqual([{ type: "quotaExceeded", modelId: "test-model" }])
		})

		test("emptyResponse", async () => {
			const { events, onChaos } = collect()
			const wrapped = cruelModel(createMockModel(), { emptyResponse: 1, onChaos })
			try { await wrapped.doGenerate(TEST_PARAMS) } catch {}
			expect(events).toEqual([{ type: "emptyResponse", modelId: "test-model" }])
		})

		test("fail", async () => {
			const { events, onChaos } = collect()
			const wrapped = cruelModel(createMockModel(), { fail: 1, onChaos })
			try { await wrapped.doGenerate(TEST_PARAMS) } catch {}
			expect(events).toEqual([{ type: "fail", modelId: "test-model" }])
		})

		test("delay includes ms", async () => {
			const { events, onChaos } = collect()
			const wrapped = cruelModel(createMockModel(), { delay: 1, onChaos })
			await wrapped.doGenerate(TEST_PARAMS)
			expect(events).toHaveLength(1)
			expect(events[0].type).toBe("delay")
			if (events[0].type === "delay") {
				expect(events[0].modelId).toBe("test-model")
				expect(events[0].ms).toBe(1)
			}
		})
	})

	describe("post chaos", () => {
		test("partialResponse", async () => {
			const { events, onChaos } = collect()
			const wrapped = cruelModel(createMockModel(), { partialResponse: 1, onChaos })
			await wrapped.doGenerate(TEST_PARAMS)
			expect(events).toEqual([{ type: "partialResponse", modelId: "test-model" }])
		})
	})

	describe("stream chaos", () => {
		test("streamCut", async () => {
			const { events, onChaos } = collect()
			const wrapped = cruelModel(createMockModel(), { streamCut: 1, onChaos })
			const result = await wrapped.doStream(TEST_PARAMS)
			try { await collectStream(result.stream) } catch {}
			expect(events.some((e) => e.type === "streamCut")).toBe(true)
			expect(events.find((e) => e.type === "streamCut")).toEqual({
				type: "streamCut",
				modelId: "test-model",
			})
		})

		test("corruptChunk", async () => {
			const { events, onChaos } = collect()
			const model = createMockModel({
				doStream: async () => ({
					stream: createMockStream([
						{ type: "text-delta", id: "t1", delta: "hello world" },
						{
							type: "finish",
							finishReason: { unified: "stop", raw: undefined },
							usage: MOCK_USAGE,
						},
					]),
				}),
			})
			const wrapped = cruelModel(model, { corruptChunks: 1, onChaos })
			const result = await wrapped.doStream(TEST_PARAMS)
			await collectStream(result.stream)
			expect(events).toEqual([{ type: "corruptChunk", modelId: "test-model" }])
		})

		test("slowTokens emits once with ms", async () => {
			const { events, onChaos } = collect()
			const wrapped = cruelModel(createMockModel(), { slowTokens: 1, onChaos })
			const result = await wrapped.doStream(TEST_PARAMS)
			await collectStream(result.stream)
			const slow = events.filter((e) => e.type === "slowTokens")
			expect(slow).toHaveLength(1)
			if (slow[0].type === "slowTokens") {
				expect(slow[0].modelId).toBe("test-model")
				expect(slow[0].ms).toBe(1)
			}
		})
	})

	describe("tools", () => {
		test("toolFailure", async () => {
			const { events, onChaos } = collect()
			const tool = {
				description: "test",
				execute: async (input: string) => `result: ${input}`,
			}
			const wrapped = cruelTool(tool, { toolFailure: 1, onChaos })
			try { await wrapped.execute("hello") } catch {}
			expect(events).toEqual([{ type: "toolFailure" }])
		})
	})

	describe("embedding model", () => {
		test("fires event on rateLimit", async () => {
			const { events, onChaos } = collect()
			const wrapped = cruelEmbeddingModel(createMockEmbeddingModel(), {
				rateLimit: 1,
				onChaos,
			})
			try { await wrapped.doEmbed({ values: ["hello"] }) } catch {}
			expect(events).toEqual([{ type: "rateLimit", modelId: "test-embedding" }])
		})
	})

	describe("middleware", () => {
		test("fires event on wrapGenerate", async () => {
			const { events, onChaos } = collect()
			const mw = cruelMiddleware({ rateLimit: 1, onChaos })
			const model = createMockModel()
			try {
				await mw.wrapGenerate!({
					doGenerate: async () => MOCK_RESULT,
					doStream: async () => ({ stream: createMockStream([]) }),
					params: TEST_PARAMS,
					model,
				})
			} catch {}
			expect(events).toEqual([{ type: "rateLimit", modelId: "test-model" }])
		})

		test("fires event on wrapStream", async () => {
			const { events, onChaos } = collect()
			const mw = cruelMiddleware({ streamCut: 1, onChaos })
			const model = createMockModel()
			const result = await mw.wrapStream!({
				doGenerate: async () => MOCK_RESULT,
				doStream: async () => ({
					stream: createMockStream([
						{ type: "text-delta", id: "t1", delta: "hi" },
						{
							type: "finish",
							finishReason: { unified: "stop", raw: undefined },
							usage: MOCK_USAGE,
						},
					]),
				}),
				params: TEST_PARAMS,
				model,
			})
			try { await collectStream(result.stream) } catch {}
			expect(events.some((e) => e.type === "streamCut")).toBe(true)
		})
	})
})

describe("diagnostics", () => {
	test("context initializes empty", () => {
		const ctx = diagnostics.context()
		expect(ctx.events).toEqual([])
		expect(ctx.requests).toEqual([])
		expect(ctx.current).toBe(0)
	})

	test("tracker records events with timestamp and request id", () => {
		const ctx = diagnostics.context()
		const track = diagnostics.tracker(ctx)
		diagnostics.before(ctx, 1)
		track({ type: "rateLimit", modelId: "gpt-4o" })
		track({ type: "delay", modelId: "gpt-4o", ms: 500 })
		expect(ctx.events).toHaveLength(2)
		expect(ctx.events[0].type).toBe("rateLimit")
		expect(ctx.events[0].req).toBe(1)
		expect(ctx.events[1].type).toBe("delay")
		expect(ctx.events[1].ts).toBeGreaterThanOrEqual(0)
	})

	test("success records a passing request", () => {
		const ctx = diagnostics.context()
		diagnostics.before(ctx, 1)
		diagnostics.success(ctx, 1, 150, "hello world")
		expect(ctx.requests).toHaveLength(1)
		expect(ctx.requests[0].ok).toBe(true)
		expect(ctx.requests[0].ms).toBe(150)
		expect(ctx.requests[0].text).toBe("hello world")
	})

	test("failure records a failing request", () => {
		const ctx = diagnostics.context()
		diagnostics.before(ctx, 1)
		const err = new CruelAPIError({ message: "Rate limit exceeded", statusCode: 429 })
		diagnostics.failure(ctx, 1, 200, err)
		expect(ctx.requests).toHaveLength(1)
		expect(ctx.requests[0].ok).toBe(false)
		expect(ctx.requests[0].status).toBe(429)
		expect(ctx.requests[0].retryable).toBe(true)
	})

	test("stats computes correct summary", () => {
		const ctx = diagnostics.context()
		const track = diagnostics.tracker(ctx)

		diagnostics.before(ctx, 1)
		track({ type: "delay", modelId: "test", ms: 100 })
		diagnostics.success(ctx, 1, 200, "ok")

		diagnostics.before(ctx, 2)
		track({ type: "rateLimit", modelId: "test" })
		diagnostics.failure(ctx, 2, 50, new Error("rate limited"))

		diagnostics.before(ctx, 3)
		track({ type: "delay", modelId: "test", ms: 300 })
		track({ type: "partialResponse", modelId: "test" })
		diagnostics.success(ctx, 3, 400, "partial")

		const s = diagnostics.stats(ctx)
		expect(s.total).toBe(3)
		expect(s.succeeded).toBe(2)
		expect(s.failed).toBe(1)
		expect(s.successRate).toBeCloseTo(0.667, 2)
		expect(s.totalEvents).toBe(4)
		expect(s.events).toHaveLength(3)
		expect(s.events[0].type).toBe("delay")
		expect(s.events[0].count).toBe(2)
		expect(s.latency.success.avg).toBe(300)
		expect(s.latency.failure.avg).toBe(50)
		expect(s.errors).toHaveLength(1)
	})

	test("stats returns zero values for empty context", () => {
		const ctx = diagnostics.context()
		const s = diagnostics.stats(ctx)
		expect(s.total).toBe(0)
		expect(s.succeeded).toBe(0)
		expect(s.failed).toBe(0)
		expect(s.successRate).toBe(0)
		expect(s.totalEvents).toBe(0)
		expect(s.events).toEqual([])
	})

	test("failure counts retries from chaos events", () => {
		const ctx = diagnostics.context()
		const track = diagnostics.tracker(ctx)
		diagnostics.before(ctx, 1)
		track({ type: "rateLimit", modelId: "test" })
		track({ type: "overloaded", modelId: "test" })
		track({ type: "rateLimit", modelId: "test" })
		diagnostics.failure(ctx, 1, 6000, new Error("failed after retries"))
		expect(ctx.requests[0].retries).toBe(3)
	})

	test("events are grouped by request", () => {
		const ctx = diagnostics.context()
		const track = diagnostics.tracker(ctx)

		diagnostics.before(ctx, 1)
		track({ type: "delay", modelId: "test", ms: 100 })
		diagnostics.success(ctx, 1, 200, "ok")

		diagnostics.before(ctx, 2)
		track({ type: "rateLimit", modelId: "test" })
		track({ type: "streamCut", modelId: "test" })
		diagnostics.failure(ctx, 2, 100, new Error("cut"))

		expect(ctx.requests[0].events).toHaveLength(1)
		expect(ctx.requests[1].events).toHaveLength(2)
	})
})
