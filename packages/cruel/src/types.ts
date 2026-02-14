type JSONValue = null | string | number | boolean | JSONObject | JSONArray
type JSONObject = { [key: string]: JSONValue | undefined }
type JSONArray = JSONValue[]

type SharedV3Headers = Record<string, string>
type SharedV3ProviderOptions = Record<string, JSONObject>
type SharedV3ProviderMetadata = Record<string, JSONObject>

type SharedV3Warning =
	| { type: "unsupported"; feature: string; details?: string }
	| { type: "compatibility"; feature: string; details?: string }
	| { type: "other"; message: string }

type LanguageModelV3FinishReason = {
	unified:
		| "stop"
		| "length"
		| "content-filter"
		| "tool-calls"
		| "error"
		| "other"
	raw: string | undefined
}

type LanguageModelV3Usage = {
	inputTokens: {
		total: number | undefined
		noCache: number | undefined
		cacheRead: number | undefined
		cacheWrite: number | undefined
	}
	outputTokens: {
		total: number | undefined
		text: number | undefined
		reasoning: number | undefined
	}
	raw?: JSONObject
}

type LanguageModelV3ToolChoice =
	| { type: "auto" }
	| { type: "none" }
	| { type: "required" }
	| { type: "tool"; toolName: string }

type LanguageModelV3FunctionTool = {
	type: "function"
	name: string
	description?: string
	inputSchema: JSONObject
	inputExamples?: Array<{ input: JSONObject }>
	strict?: boolean
	providerOptions?: SharedV3ProviderOptions
}

type LanguageModelV3ProviderTool = {
	type: "provider"
	id: `${string}.${string}`
	name: string
	args: Record<string, unknown>
}

type LanguageModelV3DataContent = Uint8Array | string | URL

interface LanguageModelV3TextPart {
	type: "text"
	text: string
	providerOptions?: SharedV3ProviderOptions
}

interface LanguageModelV3FilePart {
	type: "file"
	filename?: string
	data: LanguageModelV3DataContent
	mediaType: string
	providerOptions?: SharedV3ProviderOptions
}

interface LanguageModelV3ReasoningPart {
	type: "reasoning"
	text: string
	providerOptions?: SharedV3ProviderOptions
}

interface LanguageModelV3ToolCallPart {
	type: "tool-call"
	toolCallId: string
	toolName: string
	input: unknown
	providerExecuted?: boolean
	providerOptions?: SharedV3ProviderOptions
}

interface LanguageModelV3ToolResultPart {
	type: "tool-result"
	toolCallId: string
	toolName: string
	output: LanguageModelV3ToolResultOutput
	providerOptions?: SharedV3ProviderOptions
}

interface LanguageModelV3ToolApprovalResponsePart {
	type: "tool-approval-response"
	approvalId: string
	approved: boolean
	reason?: string
	providerOptions?: SharedV3ProviderOptions
}

type LanguageModelV3ToolResultOutput =
	| { type: "text"; value: string; providerOptions?: SharedV3ProviderOptions }
	| { type: "json"; value: JSONValue; providerOptions?: SharedV3ProviderOptions }
	| { type: "execution-denied"; reason?: string; providerOptions?: SharedV3ProviderOptions }
	| { type: "error-text"; value: string; providerOptions?: SharedV3ProviderOptions }
	| { type: "error-json"; value: JSONValue; providerOptions?: SharedV3ProviderOptions }
	| { type: "content"; value: Array<Record<string, unknown>> }

type LanguageModelV3Message = (
	| { role: "system"; content: string }
	| { role: "user"; content: Array<LanguageModelV3TextPart | LanguageModelV3FilePart> }
	| {
			role: "assistant"
			content: Array<
				| LanguageModelV3TextPart
				| LanguageModelV3FilePart
				| LanguageModelV3ReasoningPart
				| LanguageModelV3ToolCallPart
				| LanguageModelV3ToolResultPart
			>
	  }
	| {
			role: "tool"
			content: Array<LanguageModelV3ToolResultPart | LanguageModelV3ToolApprovalResponsePart>
	  }
) & {
	providerOptions?: SharedV3ProviderOptions
}

type LanguageModelV3Prompt = Array<LanguageModelV3Message>

type LanguageModelV3CallOptions = {
	prompt: LanguageModelV3Prompt
	maxOutputTokens?: number
	temperature?: number
	stopSequences?: string[]
	topP?: number
	topK?: number
	presencePenalty?: number
	frequencyPenalty?: number
	responseFormat?:
		| { type: "text" }
		| { type: "json"; schema?: JSONObject; name?: string; description?: string }
	seed?: number
	tools?: Array<LanguageModelV3FunctionTool | LanguageModelV3ProviderTool>
	toolChoice?: LanguageModelV3ToolChoice
	includeRawChunks?: boolean
	abortSignal?: AbortSignal
	headers?: Record<string, string | undefined>
	providerOptions?: SharedV3ProviderOptions
}

type LanguageModelV3Content =
	| { type: "text"; text: string; providerMetadata?: SharedV3ProviderMetadata }
	| { type: "reasoning"; text: string; providerMetadata?: SharedV3ProviderMetadata }
	| { type: "file"; mediaType: string; data: string | Uint8Array; providerMetadata?: SharedV3ProviderMetadata }
	| {
			type: "tool-call"
			toolCallId: string
			toolName: string
			input: string
			providerExecuted?: boolean
			dynamic?: boolean
			providerMetadata?: SharedV3ProviderMetadata
	  }
	| {
			type: "tool-result"
			toolCallId: string
			toolName: string
			result: NonNullable<JSONValue>
			isError?: boolean
			preliminary?: boolean
			dynamic?: boolean
			providerMetadata?: SharedV3ProviderMetadata
	  }
	| {
			type: "tool-approval-request"
			approvalId: string
			toolCallId: string
			providerMetadata?: SharedV3ProviderMetadata
	  }
	| {
			type: "source"
			sourceType: "url"
			id: string
			url: string
			title?: string
			providerMetadata?: SharedV3ProviderMetadata
	  }
	| {
			type: "source"
			sourceType: "document"
			id: string
			mediaType: string
			title: string
			filename?: string
			providerMetadata?: SharedV3ProviderMetadata
	  }

interface LanguageModelV3ResponseMetadata {
	id?: string
	timestamp?: Date
	modelId?: string
}

type LanguageModelV3GenerateResult = {
	content: Array<LanguageModelV3Content>
	finishReason: LanguageModelV3FinishReason
	usage: LanguageModelV3Usage
	providerMetadata?: SharedV3ProviderMetadata
	request?: { body?: unknown }
	response?: LanguageModelV3ResponseMetadata & {
		headers?: SharedV3Headers
		body?: unknown
	}
	warnings: Array<SharedV3Warning>
}

type LanguageModelV3StreamPart =
	| { type: "text-start"; id: string; providerMetadata?: SharedV3ProviderMetadata }
	| { type: "text-delta"; id: string; delta: string; providerMetadata?: SharedV3ProviderMetadata }
	| { type: "text-end"; id: string; providerMetadata?: SharedV3ProviderMetadata }
	| { type: "reasoning-start"; id: string; providerMetadata?: SharedV3ProviderMetadata }
	| { type: "reasoning-delta"; id: string; delta: string; providerMetadata?: SharedV3ProviderMetadata }
	| { type: "reasoning-end"; id: string; providerMetadata?: SharedV3ProviderMetadata }
	| {
			type: "tool-input-start"
			id: string
			toolName: string
			providerMetadata?: SharedV3ProviderMetadata
			providerExecuted?: boolean
			dynamic?: boolean
			title?: string
	  }
	| { type: "tool-input-delta"; id: string; delta: string; providerMetadata?: SharedV3ProviderMetadata }
	| { type: "tool-input-end"; id: string; providerMetadata?: SharedV3ProviderMetadata }
	| {
			type: "tool-approval-request"
			approvalId: string
			toolCallId: string
			providerMetadata?: SharedV3ProviderMetadata
	  }
	| {
			type: "tool-call"
			toolCallId: string
			toolName: string
			input: string
			providerExecuted?: boolean
			dynamic?: boolean
			providerMetadata?: SharedV3ProviderMetadata
	  }
	| {
			type: "tool-result"
			toolCallId: string
			toolName: string
			result: NonNullable<JSONValue>
			isError?: boolean
			preliminary?: boolean
			dynamic?: boolean
			providerMetadata?: SharedV3ProviderMetadata
	  }
	| { type: "file"; mediaType: string; data: string | Uint8Array; providerMetadata?: SharedV3ProviderMetadata }
	| {
			type: "source"
			sourceType: "url"
			id: string
			url: string
			title?: string
			providerMetadata?: SharedV3ProviderMetadata
	  }
	| {
			type: "source"
			sourceType: "document"
			id: string
			mediaType: string
			title: string
			filename?: string
			providerMetadata?: SharedV3ProviderMetadata
	  }
	| { type: "stream-start"; warnings: Array<SharedV3Warning> }
	| ({ type: "response-metadata" } & LanguageModelV3ResponseMetadata)
	| {
			type: "finish"
			usage: LanguageModelV3Usage
			finishReason: LanguageModelV3FinishReason
			providerMetadata?: SharedV3ProviderMetadata
	  }
	| { type: "raw"; rawValue: unknown }
	| { type: "error"; error: unknown }

type LanguageModelV3StreamResult = {
	stream: ReadableStream<LanguageModelV3StreamPart>
	request?: { body?: unknown }
	response?: { headers?: SharedV3Headers }
}

type LanguageModelV3 = {
	readonly specificationVersion: "v3"
	readonly provider: string
	readonly modelId: string
	supportedUrls:
		| PromiseLike<Record<string, RegExp[]>>
		| Record<string, RegExp[]>
	doGenerate(
		options: LanguageModelV3CallOptions,
	): PromiseLike<LanguageModelV3GenerateResult>
	doStream(
		options: LanguageModelV3CallOptions,
	): PromiseLike<LanguageModelV3StreamResult>
}

type LanguageModelV3Middleware = {
	readonly specificationVersion: "v3"
	overrideProvider?: (options: { model: LanguageModelV3 }) => string
	overrideModelId?: (options: { model: LanguageModelV3 }) => string
	overrideSupportedUrls?: (options: {
		model: LanguageModelV3
	}) => Record<string, RegExp[]> | PromiseLike<Record<string, RegExp[]>>
	transformParams?: (options: {
		type: "generate" | "stream"
		params: LanguageModelV3CallOptions
		model: LanguageModelV3
	}) => PromiseLike<LanguageModelV3CallOptions>
	wrapGenerate?: (options: {
		doGenerate: () => PromiseLike<LanguageModelV3GenerateResult>
		doStream: () => PromiseLike<LanguageModelV3StreamResult>
		params: LanguageModelV3CallOptions
		model: LanguageModelV3
	}) => PromiseLike<LanguageModelV3GenerateResult>
	wrapStream?: (options: {
		doGenerate: () => PromiseLike<LanguageModelV3GenerateResult>
		doStream: () => PromiseLike<LanguageModelV3StreamResult>
		params: LanguageModelV3CallOptions
		model: LanguageModelV3
	}) => PromiseLike<LanguageModelV3StreamResult>
}

type EmbeddingModelV3Embedding = Array<number>

type EmbeddingModelV3CallOptions = {
	values: Array<string>
	abortSignal?: AbortSignal
	providerOptions?: SharedV3ProviderOptions
	headers?: SharedV3Headers
}

type EmbeddingModelV3Result = {
	embeddings: Array<EmbeddingModelV3Embedding>
	usage?: { tokens: number }
	providerMetadata?: SharedV3ProviderMetadata
	response?: { headers?: SharedV3Headers; body?: unknown }
	warnings: Array<SharedV3Warning>
}

type EmbeddingModelV3 = {
	readonly specificationVersion: "v3"
	readonly provider: string
	readonly modelId: string
	readonly maxEmbeddingsPerCall:
		| PromiseLike<number | undefined>
		| number
		| undefined
	readonly supportsParallelCalls: PromiseLike<boolean> | boolean
	doEmbed(
		options: EmbeddingModelV3CallOptions,
	): PromiseLike<EmbeddingModelV3Result>
}

type ImageModelV3File =
	| { type: "file"; mediaType: string; data: string | Uint8Array; providerOptions?: SharedV3ProviderMetadata }
	| { type: "url"; url: string; providerOptions?: SharedV3ProviderMetadata }

type ImageModelV3CallOptions = {
	prompt: string | undefined
	n: number
	size: `${number}x${number}` | undefined
	aspectRatio: `${number}:${number}` | undefined
	seed: number | undefined
	files: ImageModelV3File[] | undefined
	mask: ImageModelV3File | undefined
	providerOptions: SharedV3ProviderOptions
	abortSignal?: AbortSignal
	headers?: Record<string, string | undefined>
}

type ImageModelV3Result = {
	images: Array<string> | Array<Uint8Array>
	warnings: Array<SharedV3Warning>
	providerMetadata?: Record<string, { images: JSONArray } & JSONValue>
	response: { timestamp: Date; modelId: string; headers: Record<string, string> | undefined }
	usage?: { inputTokens: number | undefined; outputTokens: number | undefined; totalTokens: number | undefined }
}

type ImageModelV3 = {
	readonly specificationVersion: "v3"
	readonly provider: string
	readonly modelId: string
	readonly maxImagesPerCall:
		| number
		| undefined
		| ((options: { modelId: string }) => PromiseLike<number | undefined> | number | undefined)
	doGenerate(options: ImageModelV3CallOptions): PromiseLike<ImageModelV3Result>
}

type SpeechModelV3CallOptions = {
	text: string
	voice?: string
	outputFormat?: string
	instructions?: string
	speed?: number
	language?: string
	providerOptions?: SharedV3ProviderOptions
	abortSignal?: AbortSignal
	headers?: Record<string, string | undefined>
}

type SpeechModelV3Result = {
	audio: string | Uint8Array
	warnings: Array<SharedV3Warning>
	request?: { body?: unknown }
	response: {
		timestamp: Date
		modelId: string
		headers?: SharedV3Headers
		body?: unknown
	}
	providerMetadata?: Record<string, JSONObject>
}

type SpeechModelV3 = {
	readonly specificationVersion: "v3"
	readonly provider: string
	readonly modelId: string
	doGenerate(options: SpeechModelV3CallOptions): PromiseLike<SpeechModelV3Result>
}

type TranscriptionModelV3CallOptions = {
	audio: Uint8Array | string
	mediaType: string
	providerOptions?: SharedV3ProviderOptions
	abortSignal?: AbortSignal
	headers?: Record<string, string | undefined>
}

type TranscriptionModelV3Result = {
	text: string
	segments: Array<{ text: string; startSecond: number; endSecond: number }>
	language: string | undefined
	durationInSeconds: number | undefined
	warnings: Array<SharedV3Warning>
	request?: { body?: string }
	response: {
		timestamp: Date
		modelId: string
		headers?: SharedV3Headers
		body?: unknown
	}
	providerMetadata?: Record<string, JSONObject>
}

type TranscriptionModelV3 = {
	readonly specificationVersion: "v3"
	readonly provider: string
	readonly modelId: string
	doGenerate(
		options: TranscriptionModelV3CallOptions,
	): PromiseLike<TranscriptionModelV3Result>
}

type VideoModelV3File =
	| { type: "file"; mediaType: string; data: string | Uint8Array; providerOptions?: SharedV3ProviderMetadata }
	| { type: "url"; url: string; providerOptions?: SharedV3ProviderMetadata }

type VideoModelV3CallOptions = {
	prompt: string | undefined
	n: number
	aspectRatio: `${number}:${number}` | undefined
	resolution: `${number}x${number}` | undefined
	duration: number | undefined
	fps: number | undefined
	seed: number | undefined
	image: VideoModelV3File | undefined
	providerOptions: SharedV3ProviderOptions
	abortSignal?: AbortSignal
	headers?: Record<string, string | undefined>
}

type VideoModelV3Result = {
	videos: Array<
		| { type: "url"; url: string; mediaType: string }
		| { type: "base64"; data: string; mediaType: string }
		| { type: "binary"; data: Uint8Array; mediaType: string }
	>
	warnings: Array<SharedV3Warning>
	providerMetadata?: SharedV3ProviderMetadata
	response: { timestamp: Date; modelId: string; headers: Record<string, string> | undefined }
}

type VideoModelV3 = {
	readonly specificationVersion: "v3"
	readonly provider: string
	readonly modelId: string
	readonly maxVideosPerCall:
		| number
		| undefined
		| ((options: { modelId: string }) => PromiseLike<number | undefined> | number | undefined)
	doGenerate(options: VideoModelV3CallOptions): PromiseLike<VideoModelV3Result>
}

type ProviderV3 = {
	readonly specificationVersion: "v3"
	languageModel(modelId: string): LanguageModelV3
	embeddingModel(modelId: string): EmbeddingModelV3
	textEmbeddingModel?(modelId: string): EmbeddingModelV3
	imageModel(modelId: string): ImageModelV3
	transcriptionModel?(modelId: string): TranscriptionModelV3
	speechModel?(modelId: string): SpeechModelV3
}

type LanguageModelV3UnifiedFinishReason =
	| "stop"
	| "length"
	| "content-filter"
	| "tool-calls"
	| "error"
	| "other"

type ChaosEvent =
	| { type: "rateLimit"; modelId: string }
	| { type: "overloaded"; modelId: string }
	| { type: "contextLength"; modelId: string }
	| { type: "contentFilter"; modelId: string }
	| { type: "modelUnavailable"; modelId: string }
	| { type: "invalidApiKey"; modelId: string }
	| { type: "quotaExceeded"; modelId: string }
	| { type: "emptyResponse"; modelId: string }
	| { type: "fail"; modelId: string }
	| { type: "timeout"; modelId: string }
	| { type: "delay"; modelId: string; ms: number }
	| { type: "streamCut"; modelId: string }
	| { type: "slowTokens"; modelId: string; ms: number }
	| { type: "corruptChunk"; modelId: string }
	| { type: "partialResponse"; modelId: string }
	| { type: "toolFailure" }
	| { type: "toolTimeout" }

type CruelChaosOptions = {
	onChaos?: (event: ChaosEvent) => void
	fail?: number
	delay?: number | [number, number]
	timeout?: number
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
	emptyResponse?: number
	finishReason?: LanguageModelV3UnifiedFinishReason
	tokenUsage?: { inputTokens?: number; outputTokens?: number }
}

type CruelModelOptions = CruelChaosOptions

type CruelProviderOptions = CruelChaosOptions & {
	models?: Record<string, CruelChaosOptions>
}

type CruelMiddlewareOptions = CruelChaosOptions

type CruelEmbeddingOptions = {
	onChaos?: (event: ChaosEvent) => void
	fail?: number
	delay?: number | [number, number]
	timeout?: number
	rateLimit?: number | { rate: number; retryAfter?: number }
	overloaded?: number
	invalidApiKey?: number
	quotaExceeded?: number
}

type CruelImageOptions = CruelEmbeddingOptions
type CruelSpeechOptions = CruelEmbeddingOptions
type CruelTranscriptionOptions = CruelEmbeddingOptions
type CruelVideoOptions = CruelEmbeddingOptions

export type {
	ChaosEvent,
	JSONValue,
	JSONObject,
	JSONArray,
	SharedV3Headers,
	SharedV3ProviderOptions,
	SharedV3ProviderMetadata,
	LanguageModelV3,
	LanguageModelV3CallOptions,
	LanguageModelV3Content,
	LanguageModelV3DataContent,
	LanguageModelV3FinishReason,
	LanguageModelV3UnifiedFinishReason,
	LanguageModelV3FunctionTool,
	LanguageModelV3ProviderTool,
	LanguageModelV3GenerateResult,
	LanguageModelV3Message,
	LanguageModelV3Middleware,
	LanguageModelV3Prompt,
	LanguageModelV3ResponseMetadata,
	LanguageModelV3StreamPart,
	LanguageModelV3StreamResult,
	LanguageModelV3TextPart,
	LanguageModelV3FilePart,
	LanguageModelV3ReasoningPart,
	LanguageModelV3ToolCallPart,
	LanguageModelV3ToolResultPart,
	LanguageModelV3ToolApprovalResponsePart,
	LanguageModelV3ToolResultOutput,
	LanguageModelV3ToolChoice,
	LanguageModelV3Usage,
	EmbeddingModelV3,
	EmbeddingModelV3CallOptions,
	EmbeddingModelV3Embedding,
	EmbeddingModelV3Result,
	ImageModelV3,
	ImageModelV3CallOptions,
	ImageModelV3File,
	ImageModelV3Result,
	SpeechModelV3,
	SpeechModelV3CallOptions,
	SpeechModelV3Result,
	TranscriptionModelV3,
	TranscriptionModelV3CallOptions,
	TranscriptionModelV3Result,
	VideoModelV3,
	VideoModelV3CallOptions,
	VideoModelV3File,
	VideoModelV3Result,
	SharedV3Warning,
	ProviderV3,
	CruelChaosOptions,
	CruelModelOptions,
	CruelProviderOptions,
	CruelMiddlewareOptions,
	CruelEmbeddingOptions,
	CruelImageOptions,
	CruelSpeechOptions,
	CruelTranscriptionOptions,
	CruelVideoOptions,
}
