const baseMarker = Symbol.for("vercel.ai.error")
const apiCallMarker = Symbol.for("vercel.ai.error.AI_APICallError")

class CruelAPIError extends Error {
	readonly [baseMarker] = true;
	readonly [apiCallMarker] = true;
	readonly statusCode: number
	readonly isRetryable: boolean
	readonly url: string
	readonly requestBodyValues: Record<string, unknown>
	readonly responseHeaders?: Record<string, string>
	readonly responseBody?: string
	readonly data?: unknown

	constructor(options: {
		message: string
		statusCode: number
		isRetryable?: boolean
		data?: unknown
	}) {
		super(options.message)
		this.name = "AI_APICallError"
		this.statusCode = options.statusCode
		this.isRetryable =
			options.isRetryable ??
			(options.statusCode === 408 ||
				options.statusCode === 409 ||
				options.statusCode === 429 ||
				options.statusCode >= 500)
		this.url = "https://api.cruel.dev/chaos"
		this.requestBodyValues = {}
		this.data = options.data
	}
}

function rateLimitError(retryAfter?: number): CruelAPIError {
	return new CruelAPIError({
		message: "Rate limit exceeded",
		statusCode: 429,
		data: retryAfter ? { retryAfter } : undefined,
	})
}

function overloadedError(): CruelAPIError {
	return new CruelAPIError({
		message: "Model is overloaded",
		statusCode: 529,
	})
}

function contextLengthError(): CruelAPIError {
	return new CruelAPIError({
		message: "Context length exceeded",
		statusCode: 400,
		isRetryable: false,
	})
}

function contentFilterError(): CruelAPIError {
	return new CruelAPIError({
		message: "Content filtered",
		statusCode: 400,
		isRetryable: false,
	})
}

function modelUnavailableError(modelId?: string): CruelAPIError {
	return new CruelAPIError({
		message: modelId ? `Model ${modelId} unavailable` : "Model unavailable",
		statusCode: 503,
	})
}

function invalidApiKeyError(): CruelAPIError {
	return new CruelAPIError({
		message: "Invalid API key",
		statusCode: 401,
		isRetryable: false,
	})
}

function quotaExceededError(): CruelAPIError {
	return new CruelAPIError({
		message: "Quota exceeded",
		statusCode: 402,
		isRetryable: false,
	})
}

function streamCutError(): CruelAPIError {
	return new CruelAPIError({
		message: "Stream interrupted",
		statusCode: 500,
	})
}

function emptyResponseError(): CruelAPIError {
	return new CruelAPIError({
		message: "Empty response",
		statusCode: 200,
		isRetryable: false,
	})
}

export {
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
