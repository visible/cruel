import {
	CruelAPIError,
	contentFilterError,
	contextLengthError,
	emptyResponseError,
	invalidApiKeyError,
	modelUnavailableError,
	overloadedError,
	quotaExceededError,
	rateLimitError,
	streamCutError,
} from "./errors.js"
import type {
	CruelChaosOptions,
	CruelEmbeddingOptions,
	CruelImageOptions,
	CruelMiddlewareOptions,
	CruelModelOptions,
	CruelProviderOptions,
	CruelSpeechOptions,
	CruelTranscriptionOptions,
	CruelVideoOptions,
	EmbeddingModelV3,
	EmbeddingModelV3CallOptions,
	ImageModelV3,
	ImageModelV3CallOptions,
	LanguageModelV3,
	LanguageModelV3CallOptions,
	LanguageModelV3Content,
	LanguageModelV3GenerateResult,
	LanguageModelV3Middleware,
	LanguageModelV3StreamPart,
	LanguageModelV3Usage,
	ProviderV3,
	SpeechModelV3,
	SpeechModelV3CallOptions,
	TranscriptionModelV3,
	TranscriptionModelV3CallOptions,
	VideoModelV3,
	VideoModelV3CallOptions,
} from "./types.js"

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

async function applyChaos(opts: CruelChaosOptions | undefined, modelId?: string): Promise<void> {
	if (!opts) return
	const id = modelId ?? "unknown"
	const emit = opts.onChaos

	if (chance(opts.invalidApiKey)) {
		emit?.({ type: "invalidApiKey", modelId: id })
		throw invalidApiKeyError()
	}
	if (chance(opts.quotaExceeded)) {
		emit?.({ type: "quotaExceeded", modelId: id })
		throw quotaExceededError()
	}
	if (chance(opts.modelUnavailable)) {
		emit?.({ type: "modelUnavailable", modelId: id })
		throw modelUnavailableError(modelId)
	}
	if (chance(opts.contextLength)) {
		emit?.({ type: "contextLength", modelId: id })
		throw contextLengthError()
	}
	if (chance(opts.contentFilter)) {
		emit?.({ type: "contentFilter", modelId: id })
		throw contentFilterError()
	}
	if (chance(opts.emptyResponse)) {
		emit?.({ type: "emptyResponse", modelId: id })
		throw emptyResponseError()
	}

	const rl = opts.rateLimit
	if (rl) {
		const rate = typeof rl === "number" ? rl : rl.rate
		const retryAfter = typeof rl === "number" ? 60 : rl.retryAfter
		if (chance(rate)) {
			emit?.({ type: "rateLimit", modelId: id })
			throw rateLimitError(retryAfter)
		}
	}

	if (chance(opts.overloaded)) {
		emit?.({ type: "overloaded", modelId: id })
		throw overloadedError()
	}

	if (chance(opts.timeout)) {
		emit?.({ type: "timeout", modelId: id })
		await new Promise(() => {})
	}

	if (chance(opts.fail)) {
		emit?.({ type: "fail", modelId: id })
		throw new CruelAPIError({
			message: "Generation failed",
			statusCode: 500,
		})
	}

	const delay = getDelay(opts.delay)
	if (delay > 0) {
		emit?.({ type: "delay", modelId: id, ms: delay })
		await sleep(delay)
	}
}

function applyPostChaos(
	result: LanguageModelV3GenerateResult,
	opts: CruelChaosOptions | undefined,
	modelId?: string,
): LanguageModelV3GenerateResult {
	if (!opts) return result

	let modified = result

	if (chance(opts.partialResponse)) {
		opts.onChaos?.({ type: "partialResponse", modelId: modelId ?? "unknown" })
		modified = {
			...modified,
			content: modified.content.map((item: LanguageModelV3Content) => {
				if (item.type === "text" && item.text.length > 0) {
					const cutPoint = Math.floor(random() * item.text.length * 0.7) + item.text.length * 0.1
					return { ...item, text: item.text.slice(0, cutPoint) }
				}
				return item
			}),
		}
	}

	if (opts.finishReason) {
		modified = {
			...modified,
			finishReason: { unified: opts.finishReason, raw: undefined },
		}
	}

	if (opts.tokenUsage) {
		modified = {
			...modified,
			usage: buildUsage(opts.tokenUsage, modified.usage),
		}
	}

	return modified
}

function buildUsage(
	override: { inputTokens?: number; outputTokens?: number },
	original: LanguageModelV3Usage,
): LanguageModelV3Usage {
	return {
		inputTokens: {
			total: override.inputTokens ?? original.inputTokens.total,
			noCache: undefined,
			cacheRead: undefined,
			cacheWrite: undefined,
		},
		outputTokens: {
			total: override.outputTokens ?? original.outputTokens.total,
			text: undefined,
			reasoning: undefined,
		},
	}
}

function applyStreamChaos(
	stream: ReadableStream<LanguageModelV3StreamPart>,
	opts: CruelChaosOptions | undefined,
	modelId?: string,
): ReadableStream<LanguageModelV3StreamPart> {
	if (!opts) return stream
	let result = stream
	const id = modelId ?? "unknown"
	const emit = opts.onChaos

	if (opts.slowTokens) {
		const delay = opts.slowTokens
		let emitted = false
		result = result.pipeThrough(
			new TransformStream<LanguageModelV3StreamPart, LanguageModelV3StreamPart>({
				async transform(chunk, controller) {
					if (chunk.type === "text-delta") {
						const ms = getDelay(delay)
						if (!emitted) {
							emit?.({ type: "slowTokens", modelId: id, ms })
							emitted = true
						}
						await sleep(ms)
					}
					controller.enqueue(chunk)
				},
			}),
		)
	}

	if (opts.corruptChunks) {
		const rate = opts.corruptChunks
		result = result.pipeThrough(
			new TransformStream<LanguageModelV3StreamPart, LanguageModelV3StreamPart>({
				transform(chunk, controller) {
					if (chance(rate) && chunk.type === "text-delta") {
						emit?.({ type: "corruptChunk", modelId: id })
						const text = chunk.delta
						const pos = Math.floor(random() * text.length)
						controller.enqueue({
							...chunk,
							delta: `${text.slice(0, pos)}\uFFFD${text.slice(pos + 1)}`,
						})
						return
					}
					controller.enqueue(chunk)
				},
			}),
		)
	}

	if (opts.streamCut) {
		const rate = opts.streamCut
		result = result.pipeThrough(
			new TransformStream<LanguageModelV3StreamPart, LanguageModelV3StreamPart>({
				transform(chunk, controller) {
					if (chance(rate) && chunk.type === "text-delta") {
						emit?.({ type: "streamCut", modelId: id })
						controller.error(streamCutError())
						return
					}
					controller.enqueue(chunk)
				},
			}),
		)
	}

	if (opts.tokenUsage) {
		const override = opts.tokenUsage
		result = result.pipeThrough(
			new TransformStream<LanguageModelV3StreamPart, LanguageModelV3StreamPart>({
				transform(chunk, controller) {
					if (chunk.type === "finish") {
						controller.enqueue({
							...chunk,
							usage: buildUsage(override, chunk.usage),
						})
						return
					}
					controller.enqueue(chunk)
				},
			}),
		)
	}

	if (opts.finishReason) {
		const reason = opts.finishReason
		result = result.pipeThrough(
			new TransformStream<LanguageModelV3StreamPart, LanguageModelV3StreamPart>({
				transform(chunk, controller) {
					if (chunk.type === "finish") {
						controller.enqueue({
							...chunk,
							finishReason: { unified: reason, raw: undefined },
						})
						return
					}
					controller.enqueue(chunk)
				},
			}),
		)
	}

	return result
}

function cruelModel<T extends LanguageModelV3>(model: T, options?: CruelModelOptions): T {
	const modelId = model.modelId
	return {
		...model,
		modelId,
		doGenerate: async (params: LanguageModelV3CallOptions) => {
			await applyChaos(options, modelId)
			const result = await model.doGenerate(params)
			return applyPostChaos(result, options, modelId)
		},
		doStream: async (params: LanguageModelV3CallOptions) => {
			await applyChaos(options, modelId)
			const result = await model.doStream(params)
			return {
				...result,
				stream: applyStreamChaos(result.stream, options, modelId),
			}
		},
	} as T
}

function cruelEmbeddingModel<T extends EmbeddingModelV3>(
	model: T,
	options?: CruelEmbeddingOptions,
): T {
	const modelId = model.modelId
	return {
		...model,
		modelId,
		doEmbed: async (params: EmbeddingModelV3CallOptions) => {
			await applyChaos(options, modelId)
			return model.doEmbed(params)
		},
	} as T
}

function cruelImageModel<T extends ImageModelV3>(model: T, options?: CruelImageOptions): T {
	const modelId = model.modelId
	return {
		...model,
		modelId,
		doGenerate: async (params: ImageModelV3CallOptions) => {
			await applyChaos(options, modelId)
			return model.doGenerate(params)
		},
	} as T
}

function cruelSpeechModel<T extends SpeechModelV3>(model: T, options?: CruelSpeechOptions): T {
	const modelId = model.modelId
	return {
		...model,
		modelId,
		doGenerate: async (params: SpeechModelV3CallOptions) => {
			await applyChaos(options, modelId)
			return model.doGenerate(params)
		},
	} as T
}

function cruelTranscriptionModel<T extends TranscriptionModelV3>(
	model: T,
	options?: CruelTranscriptionOptions,
): T {
	const modelId = model.modelId
	return {
		...model,
		modelId,
		doGenerate: async (params: TranscriptionModelV3CallOptions) => {
			await applyChaos(options, modelId)
			return model.doGenerate(params)
		},
	} as T
}

function cruelVideoModel<T extends VideoModelV3>(model: T, options?: CruelVideoOptions): T {
	const modelId = model.modelId
	return {
		...model,
		modelId,
		doGenerate: async (params: VideoModelV3CallOptions) => {
			await applyChaos(options, modelId)
			return model.doGenerate(params)
		},
	} as T
}

function wrapProviderModel(
	prop: string | symbol,
	model: unknown,
	opts: CruelChaosOptions | undefined,
) {
	if (typeof prop === "string") {
		if (prop === "embeddingModel" || prop === "textEmbeddingModel") {
			return cruelEmbeddingModel(model as EmbeddingModelV3, opts)
		}
		if (prop === "imageModel") {
			return cruelImageModel(model as ImageModelV3, opts)
		}
		if (prop === "speechModel") {
			return cruelSpeechModel(model as SpeechModelV3, opts)
		}
		if (prop === "transcriptionModel") {
			return cruelTranscriptionModel(model as TranscriptionModelV3, opts)
		}
		if (prop === "videoModel") {
			return cruelVideoModel(model as VideoModelV3, opts)
		}
	}
	return cruelModel(model as LanguageModelV3, opts)
}

const modelMethods = new Set([
	"languageModel",
	"embeddingModel",
	"textEmbeddingModel",
	"imageModel",
	"speechModel",
	"transcriptionModel",
	"videoModel",
])

function cruelProvider<T extends ProviderV3>(provider: T, options?: CruelProviderOptions): T {
	return new Proxy(provider, {
		get(target, prop) {
			const value = Reflect.get(target, prop)
			if (typeof value === "function" && typeof prop === "string" && modelMethods.has(prop)) {
				return (...args: unknown[]) => {
					const model = value.apply(target, args)
					const modelId = typeof args[0] === "string" ? args[0] : undefined
					const modelOpts = modelId ? options?.models?.[modelId] : undefined
					return wrapProviderModel(prop, model, { ...options, ...modelOpts })
				}
			}
			return value
		},
		apply(target, thisArg, args) {
			const fn = target as unknown as (...a: unknown[]) => LanguageModelV3
			const model = Reflect.apply(fn, thisArg, args)
			const modelId = typeof args[0] === "string" ? args[0] : undefined
			const modelOpts = modelId ? options?.models?.[modelId] : undefined
			return cruelModel(model, { ...options, ...modelOpts })
		},
	})
}

function cruelMiddleware(options?: CruelMiddlewareOptions): LanguageModelV3Middleware {
	return {
		specificationVersion: "v3",
		wrapGenerate: async ({ doGenerate, model }) => {
			await applyChaos(options, model.modelId)
			const result = await doGenerate()
			return applyPostChaos(result, options, model.modelId)
		},
		wrapStream: async ({ doStream, model }) => {
			await applyChaos(options, model.modelId)
			const result = await doStream()
			return {
				...result,
				stream: applyStreamChaos(result.stream, options, model.modelId),
			}
		},
	}
}

function cruelTool<T extends { execute: (...args: any[]) => any }>(
	tool: T,
	options?: CruelChaosOptions,
): T {
	const original = tool.execute
	return {
		...tool,
		execute: async (...args: Parameters<T["execute"]>) => {
			if (chance(options?.toolFailure)) {
				options?.onChaos?.({ type: "toolFailure" })
				throw new Error("Tool execution failed")
			}
			if (chance(options?.toolTimeout)) {
				options?.onChaos?.({ type: "toolTimeout" })
				await new Promise(() => {})
			}
			const delay = getDelay(options?.delay)
			if (delay > 0) await sleep(delay)
			return original.apply(tool, args)
		},
	}
}

function cruelTools<T extends Record<string, { execute: (...args: any[]) => any }>>(
	tools: T,
	options?: CruelChaosOptions,
): T {
	const wrapped = {} as Record<string, unknown>
	for (const [name, tool] of Object.entries(tools)) {
		wrapped[name] = cruelTool(tool as { execute: (...args: never[]) => unknown }, options)
	}
	return wrapped as T
}

const presets = {
	realistic: {
		rateLimit: 0.02,
		overloaded: 0.01,
		delay: [50, 200] as [number, number],
		slowTokens: [20, 80] as [number, number],
	} satisfies CruelChaosOptions,

	unstable: {
		rateLimit: 0.1,
		overloaded: 0.05,
		streamCut: 0.05,
		delay: [100, 500] as [number, number],
		slowTokens: [50, 200] as [number, number],
	} satisfies CruelChaosOptions,

	harsh: {
		rateLimit: 0.2,
		overloaded: 0.1,
		streamCut: 0.1,
		contentFilter: 0.02,
		delay: [200, 1000] as [number, number],
		slowTokens: [100, 500] as [number, number],
	} satisfies CruelChaosOptions,

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
	} satisfies CruelChaosOptions,

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
	} satisfies CruelChaosOptions,
}

export type {
	DiagnosticsContext,
	DiagnosticsStats,
	EventCount,
	LatencyStats,
	RequestResult,
} from "./diagnostics.js"
export { diagnostics } from "./diagnostics.js"

export {
	cruelModel,
	cruelEmbeddingModel,
	cruelImageModel,
	cruelSpeechModel,
	cruelTranscriptionModel,
	cruelVideoModel,
	cruelProvider,
	cruelMiddleware,
	cruelTool,
	cruelTools,
	presets,
	CruelAPIError,
	rateLimitError,
	overloadedError,
	contextLengthError,
	contentFilterError,
	modelUnavailableError,
	invalidApiKeyError,
	quotaExceededError,
	streamCutError,
	emptyResponseError,
}

export type {
	ChaosEvent,
	CruelChaosOptions,
	CruelEmbeddingOptions,
	CruelImageOptions,
	CruelMiddlewareOptions,
	CruelModelOptions,
	CruelProviderOptions,
	CruelSpeechOptions,
	CruelTranscriptionOptions,
	CruelVideoOptions,
	EmbeddingModelV3,
	EmbeddingModelV3CallOptions,
	EmbeddingModelV3Embedding,
	EmbeddingModelV3Result,
	ImageModelV3,
	ImageModelV3CallOptions,
	ImageModelV3Result,
	JSONArray,
	JSONObject,
	JSONValue,
	LanguageModelV3,
	LanguageModelV3CallOptions,
	LanguageModelV3Content,
	LanguageModelV3FinishReason,
	LanguageModelV3FunctionTool,
	LanguageModelV3GenerateResult,
	LanguageModelV3Middleware,
	LanguageModelV3Prompt,
	LanguageModelV3ProviderTool,
	LanguageModelV3StreamPart,
	LanguageModelV3StreamResult,
	LanguageModelV3ToolChoice,
	LanguageModelV3UnifiedFinishReason,
	LanguageModelV3Usage,
	ProviderV3,
	SharedV3ProviderMetadata,
	SharedV3ProviderOptions,
	SharedV3Warning,
	SpeechModelV3,
	SpeechModelV3CallOptions,
	SpeechModelV3Result,
	TranscriptionModelV3,
	TranscriptionModelV3CallOptions,
	TranscriptionModelV3Result,
	VideoModelV3,
	VideoModelV3CallOptions,
	VideoModelV3Result,
} from "./types.js"
