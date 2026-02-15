import {
	CruelAIError,
	CruelError,
	CruelHttpError,
	CruelNetworkError,
	CruelRateLimitError,
	CruelTimeoutError,
} from "./index.js"

interface MatcherResult {
	pass: boolean
	message: () => string
}

const matchers = {
	toThrowCruelError(received: () => unknown): MatcherResult {
		try {
			received()
			return { pass: false, message: () => "expected function to throw CruelError" }
		} catch (e) {
			const pass = e instanceof CruelError
			return {
				pass,
				message: () =>
					pass
						? "expected function not to throw CruelError"
						: `expected CruelError but got ${(e as Error).name}`,
			}
		}
	},

	toThrowTimeout(received: () => unknown): MatcherResult {
		try {
			received()
			return { pass: false, message: () => "expected function to throw CruelTimeoutError" }
		} catch (e) {
			const pass = e instanceof CruelTimeoutError
			return {
				pass,
				message: () =>
					pass
						? "expected function not to throw CruelTimeoutError"
						: `expected CruelTimeoutError but got ${(e as Error).name}`,
			}
		}
	},

	toThrowNetworkError(received: () => unknown, type?: string): MatcherResult {
		try {
			received()
			return { pass: false, message: () => "expected function to throw CruelNetworkError" }
		} catch (e) {
			if (!(e instanceof CruelNetworkError)) {
				return {
					pass: false,
					message: () => `expected CruelNetworkError but got ${(e as Error).name}`,
				}
			}
			if (type && !e.code.includes(type.toUpperCase())) {
				return {
					pass: false,
					message: () => `expected network error type ${type} but got ${e.code}`,
				}
			}
			return { pass: true, message: () => "expected function not to throw CruelNetworkError" }
		}
	},

	toThrowHttpError(received: () => unknown, status?: number): MatcherResult {
		try {
			received()
			return { pass: false, message: () => "expected function to throw CruelHttpError" }
		} catch (e) {
			if (!(e instanceof CruelHttpError)) {
				return {
					pass: false,
					message: () => `expected CruelHttpError but got ${(e as Error).name}`,
				}
			}
			if (status && e.status !== status) {
				return {
					pass: false,
					message: () => `expected status ${status} but got ${e.status}`,
				}
			}
			return { pass: true, message: () => "expected function not to throw CruelHttpError" }
		}
	},

	toThrowRateLimit(received: () => unknown): MatcherResult {
		try {
			received()
			return { pass: false, message: () => "expected function to throw CruelRateLimitError" }
		} catch (e) {
			const pass = e instanceof CruelRateLimitError
			return {
				pass,
				message: () =>
					pass
						? "expected function not to throw CruelRateLimitError"
						: `expected CruelRateLimitError but got ${(e as Error).name}`,
			}
		}
	},

	toThrowAIError(received: () => unknown, type?: string): MatcherResult {
		try {
			received()
			return { pass: false, message: () => "expected function to throw CruelAIError" }
		} catch (e) {
			if (!(e instanceof CruelAIError)) {
				return {
					pass: false,
					message: () => `expected CruelAIError but got ${(e as Error).name}`,
				}
			}
			if (type && e.type !== type) {
				return {
					pass: false,
					message: () => `expected AI error type ${type} but got ${e.type}`,
				}
			}
			return { pass: true, message: () => "expected function not to throw CruelAIError" }
		}
	},

	async toEventuallyThrow(
		received: () => Promise<unknown>,
		errorType?: new () => Error,
	): Promise<MatcherResult> {
		try {
			await received()
			return { pass: false, message: () => "expected promise to reject" }
		} catch (e) {
			if (errorType && !(e instanceof errorType)) {
				return {
					pass: false,
					message: () => `expected ${errorType.name} but got ${(e as Error).name}`,
				}
			}
			return { pass: true, message: () => "expected promise not to reject" }
		}
	},

	async toCompleteWithin(received: () => Promise<unknown>, ms: number): Promise<MatcherResult> {
		const start = Date.now()
		try {
			await received()
			const elapsed = Date.now() - start
			const pass = elapsed <= ms
			return {
				pass,
				message: () =>
					pass
						? `expected to take more than ${ms}ms`
						: `expected to complete within ${ms}ms but took ${elapsed}ms`,
			}
		} catch {
			return { pass: false, message: () => "promise rejected unexpectedly" }
		}
	},

	async toTakeLongerThan(received: () => Promise<unknown>, ms: number): Promise<MatcherResult> {
		const start = Date.now()
		try {
			await received()
			const elapsed = Date.now() - start
			const pass = elapsed >= ms
			return {
				pass,
				message: () =>
					pass
						? `expected to take less than ${ms}ms`
						: `expected to take at least ${ms}ms but took ${elapsed}ms`,
			}
		} catch {
			return { pass: false, message: () => "promise rejected unexpectedly" }
		}
	},
}

function setupMatchers() {
	const g = globalThis as { expect?: { extend?: (m: unknown) => void } }
	if (g.expect && typeof g.expect.extend === "function") {
		g.expect.extend(matchers)
	}
}

declare global {
	namespace jest {
		interface Matchers<R> {
			toThrowCruelError(): R
			toThrowTimeout(): R
			toThrowNetworkError(type?: string): R
			toThrowHttpError(status?: number): R
			toThrowRateLimit(): R
			toThrowAIError(type?: string): R
			toEventuallyThrow(errorType?: new () => Error): Promise<R>
			toCompleteWithin(ms: number): Promise<R>
			toTakeLongerThan(ms: number): Promise<R>
		}
	}
}

export { matchers, setupMatchers }
