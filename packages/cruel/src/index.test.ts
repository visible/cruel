import { beforeEach, describe, expect, test } from "bun:test"
import {
	CruelAIError,
	CruelError,
	CruelHttpError,
	CruelNetworkError,
	CruelRateLimitError,
	CruelTimeoutError,
	createCruel,
	cruel,
} from "./index"

beforeEach(() => {
	cruel.reset()
})

describe("cruel", () => {
	test("wraps function without chaos when disabled", async () => {
		const fn = () => Promise.resolve(42)
		const wrapped = cruel(fn, { fail: 0, timeout: 0 })
		expect(await wrapped()).toBe(42)
	})

	test("fail throws CruelError", async () => {
		cruel.seed(12345)
		const fn = () => Promise.resolve(42)
		const wrapped = cruel(fn, { fail: 1 })
		await expect(wrapped()).rejects.toThrow(CruelError)
	})

	test("timeout never resolves", async () => {
		const fn = () => Promise.resolve(42)
		const wrapped = cruel(fn, { timeout: 1 })
		let resolved = false
		wrapped().then(() => {
			resolved = true
		})
		await new Promise((r) => setTimeout(r, 100))
		expect(resolved).toBe(false)
	})

	test("delay adds latency", async () => {
		const fn = () => Promise.resolve(42)
		const wrapped = cruel(fn, { delay: 50 })
		const start = Date.now()
		await wrapped()
		expect(Date.now() - start).toBeGreaterThanOrEqual(45)
	})

	test("delay with range", async () => {
		cruel.seed(99999)
		const fn = () => Promise.resolve(42)
		const wrapped = cruel(fn, { delay: [50, 100] })
		const start = Date.now()
		await wrapped()
		const elapsed = Date.now() - start
		expect(elapsed).toBeGreaterThanOrEqual(45)
		expect(elapsed).toBeLessThanOrEqual(150)
	})

	test("corrupt mutates string results", async () => {
		cruel.seed(12345)
		const fn = () => Promise.resolve("hello world")
		const wrapped = cruel(fn, { corrupt: 1 })
		const value = await wrapped()
		expect(value).toContain("�")
	})
})

describe("cruel.fail", () => {
	test("wraps function with failure rate", async () => {
		cruel.seed(12345)
		const fn = () => Promise.resolve(42)
		const wrapped = cruel.fail(fn, 1)
		await expect(wrapped()).rejects.toThrow(CruelError)
	})
})

describe("cruel.slow", () => {
	test("adds delay", async () => {
		const fn = () => Promise.resolve(42)
		const wrapped = cruel.slow(fn, 50)
		const start = Date.now()
		await wrapped()
		expect(Date.now() - start).toBeGreaterThanOrEqual(45)
	})
})

describe("cruel.timeout", () => {
	test("creates timeout wrapper", async () => {
		const fn = () => Promise.resolve(42)
		const wrapped = cruel.timeout(fn, 1)
		let resolved = false
		wrapped().then(() => {
			resolved = true
		})
		await new Promise((r) => setTimeout(r, 100))
		expect(resolved).toBe(false)
	})
})

describe("cruel.flaky", () => {
	test("creates flaky wrapper", async () => {
		cruel.seed(11111)
		const fn = () => Promise.resolve(42)
		const wrapped = cruel.flaky(fn, 0)
		expect(await wrapped()).toBe(42)
	})
})

describe("cruel.unreliable", () => {
	test("creates unreliable wrapper", async () => {
		const fn = () => Promise.resolve(42)
		const wrapped = cruel(fn, { delay: 50 })
		const result = await wrapped()
		expect(result).toBe(42)
	})
})

describe("cruel.nightmare", () => {
	test("creates nightmare wrapper with high fail rate", () => {
		const fn = () => Promise.resolve(42)
		const wrapped = cruel.nightmare(fn)
		expect(wrapped).toBeInstanceOf(Function)
	})
})

describe("cruel.network", () => {
	test("latency adds delay", async () => {
		const fn = () => Promise.resolve(42)
		const wrapped = cruel.network.latency(fn, 50)
		const start = Date.now()
		await wrapped()
		expect(Date.now() - start).toBeGreaterThanOrEqual(45)
	})

	test("packetLoss throws", async () => {
		const fn = () => Promise.resolve(42)
		const wrapped = cruel.network.packetLoss(fn, 1)
		await expect(wrapped()).rejects.toThrow(CruelNetworkError)
	})

	test("disconnect throws", async () => {
		const fn = () => Promise.resolve(42)
		const wrapped = cruel.network.disconnect(fn, 1)
		await expect(wrapped()).rejects.toThrow(CruelNetworkError)
	})

	test("dns throws", async () => {
		const fn = () => Promise.resolve(42)
		const wrapped = cruel.network.dns(fn, 1)
		await expect(wrapped()).rejects.toThrow(CruelNetworkError)
	})

	test("offline always throws", async () => {
		const fn = () => Promise.resolve(42)
		const wrapped = cruel.network.offline(fn)
		await expect(wrapped()).rejects.toThrow(CruelNetworkError)
	})
})

describe("cruel.http", () => {
	test("status throws with code", async () => {
		const fn = () => Promise.resolve(42)
		const wrapped = cruel.http.status(fn, 500, 1)
		await expect(wrapped()).rejects.toThrow(CruelHttpError)
	})

	test("rateLimit throws 429", async () => {
		const fn = () => Promise.resolve(42)
		const wrapped = cruel.http.rateLimit(fn, 1)
		await expect(wrapped()).rejects.toThrow(CruelRateLimitError)
	})

	test("serverError throws 5xx", async () => {
		const fn = () => Promise.resolve(42)
		const wrapped = cruel.http.serverError(fn, 1)
		await expect(wrapped()).rejects.toThrow(CruelHttpError)
	})

	test("clientError throws 4xx", async () => {
		const fn = () => Promise.resolve(42)
		const wrapped = cruel.http.clientError(fn, 1)
		await expect(wrapped()).rejects.toThrow(CruelHttpError)
	})
})

describe("cruel.stream", () => {
	test("cut throws mid-transfer", async () => {
		const fn = () => Promise.resolve("data")
		const wrapped = cruel.stream.cut(fn, 1)
		await expect(wrapped()).rejects.toThrow(CruelError)
	})

	test("pause adds delay after result", async () => {
		const fn = () => Promise.resolve("data")
		const wrapped = cruel.stream.pause(fn, 50)
		const start = Date.now()
		await wrapped()
		expect(Date.now() - start).toBeGreaterThanOrEqual(45)
	})

	test("corrupt modifies string", async () => {
		cruel.seed(44444)
		const fn = () => Promise.resolve("hello world")
		const wrapped = cruel.stream.corrupt(fn, 1)
		const result = await wrapped()
		expect(result).toContain("�")
	})

	test("truncate shortens string", async () => {
		cruel.seed(55555)
		const fn = () => Promise.resolve("hello world this is a long string")
		const wrapped = cruel.stream.truncate(fn, 1)
		const result = await wrapped()
		expect(result.length).toBeLessThan(33)
	})
})

describe("cruel.ai", () => {
	test("rateLimit throws", async () => {
		const fn = () => Promise.resolve("response")
		const wrapped = cruel.ai.rateLimit(fn, 1)
		await expect(wrapped()).rejects.toThrow(CruelAIError)
	})

	test("overloaded throws", async () => {
		const fn = () => Promise.resolve("response")
		const wrapped = cruel.ai.overloaded(fn, 1)
		await expect(wrapped()).rejects.toThrow(CruelAIError)
	})

	test("contextLength throws", async () => {
		const fn = () => Promise.resolve("response")
		const wrapped = cruel.ai.contextLength(fn, 1)
		await expect(wrapped()).rejects.toThrow(CruelAIError)
	})

	test("contentFilter throws", async () => {
		const fn = () => Promise.resolve("response")
		const wrapped = cruel.ai.contentFilter(fn, 1)
		await expect(wrapped()).rejects.toThrow(CruelAIError)
	})

	test("modelUnavailable throws", async () => {
		const fn = () => Promise.resolve("response")
		const wrapped = cruel.ai.modelUnavailable(fn, 1)
		await expect(wrapped()).rejects.toThrow(CruelAIError)
	})

	test("streamCut throws", async () => {
		const fn = () => Promise.resolve("response")
		const wrapped = cruel.ai.streamCut(fn, 1)
		await expect(wrapped()).rejects.toThrow(CruelAIError)
	})

	test("partialResponse truncates", async () => {
		cruel.seed(66666)
		const fn = () => Promise.resolve("this is a complete response")
		const wrapped = cruel.ai.partialResponse(fn, 1)
		const result = await wrapped()
		expect(result.length).toBeLessThan(27)
	})

	test("invalidJson appends garbage", async () => {
		cruel.seed(77777)
		const fn = () => Promise.resolve('{"valid": true}')
		const wrapped = cruel.ai.invalidJson(fn, 1)
		const result = await wrapped()
		expect(result).toContain("{invalid")
	})
})

describe("cruel.enable/disable", () => {
	test("enable activates global chaos", async () => {
		cruel.enable({ fail: 1 })
		const fn = () => Promise.resolve(42)
		const wrapped = cruel(fn)
		await expect(wrapped()).rejects.toThrow()
		cruel.disable()
	})

	test("disable deactivates chaos", async () => {
		cruel.enable({ fail: 1 })
		cruel.disable()
		const fn = () => Promise.resolve(42)
		const wrapped = cruel(fn)
		expect(await wrapped()).toBe(42)
	})

	test("toggle switches state", () => {
		expect(cruel.isEnabled()).toBe(false)
		cruel.toggle()
		expect(cruel.isEnabled()).toBe(true)
		cruel.toggle()
		expect(cruel.isEnabled()).toBe(false)
	})
})

describe("cruel.scope", () => {
	test("enables chaos within scope", async () => {
		const fn = () => Promise.resolve(42)
		const _wrapped = cruel(fn)

		await cruel.scope(
			async () => {
				expect(cruel.isEnabled()).toBe(true)
			},
			{ fail: 0 },
		)

		expect(cruel.isEnabled()).toBe(false)
	})

	test("restores previous state after scope", async () => {
		cruel.enable({ delay: 100 })

		await cruel.scope(
			async () => {
				expect(cruel.isEnabled()).toBe(true)
			},
			{ fail: 0 },
		)

		expect(cruel.isEnabled()).toBe(true)
		cruel.disable()
	})
})

describe("cruel.profile", () => {
	test("creates and uses profile", () => {
		cruel.profile("test", { fail: 0.5, delay: 100 })
		cruel.useProfile("test")
		expect(cruel.isEnabled()).toBe(true)
	})

	test("throws on unknown profile", () => {
		expect(() => cruel.useProfile("unknown")).toThrow()
	})
})

describe("cruel.scenario", () => {
	test("creates scenario", () => {
		cruel.scenario("test", { chaos: { fail: 0.5 } })
		expect(cruel.activeScenario()).toBe(null)
	})

	test("play activates scenario", async () => {
		cruel.scenario("quick", { chaos: { fail: 0 }, duration: 50 })
		await cruel.play("quick")
		expect(cruel.activeScenario()).toBe(null)
	})

	test("stop deactivates scenario", async () => {
		cruel.scenario("long", { chaos: { fail: 0 } })
		cruel.play("long")
		await new Promise((r) => setTimeout(r, 10))
		cruel.stop()
		expect(cruel.activeScenario()).toBe(null)
	})
})

describe("cruel.patchFetch", () => {
	test("applies intercept headers", async () => {
		const original = globalThis.fetch
		globalThis.fetch = async () => new Response("ok", { status: 200 })
		try {
			cruel.intercept("example.com", { headers: { "x-test": "1" } })
			cruel.patchFetch()
			const res = await fetch("https://example.com")
			expect(res.headers.get("x-test")).toBe("1")
		} finally {
			cruel.unpatchFetch()
			globalThis.fetch = original
		}
	})

	test("applies truncate transform", async () => {
		const original = globalThis.fetch
		globalThis.fetch = async () => new Response("abcdef", { status: 200 })
		try {
			cruel.intercept("example.com", { truncate: 1 })
			cruel.patchFetch()
			const res = await fetch("https://example.com")
			const text = await res.text()
			expect(text.length).toBeLessThan(6)
		} finally {
			cruel.unpatchFetch()
			globalThis.fetch = original
		}
	})

	test("applies malformed transform", async () => {
		const original = globalThis.fetch
		globalThis.fetch = async () => new Response('{"ok":true}', { status: 200 })
		try {
			cruel.intercept("example.com", { malformed: 1 })
			cruel.patchFetch()
			const res = await fetch("https://example.com")
			const text = await res.text()
			expect(text.endsWith("{")).toBe(true)
		} finally {
			cruel.unpatchFetch()
			globalThis.fetch = original
		}
	})
})

describe("cruel.stats", () => {
	test("tracks calls", async () => {
		const fn = () => Promise.resolve(42)
		const wrapped = cruel(fn)
		await wrapped()
		await wrapped()
		expect(cruel.stats().calls).toBe(2)
	})

	test("tracks failures", async () => {
		const fn = () => Promise.resolve(42)
		const wrapped = cruel(fn, { fail: 1 })
		try {
			await wrapped()
		} catch {}
		expect(cruel.stats().failures).toBe(1)
	})

	test("resetStats clears counters", async () => {
		const fn = () => Promise.resolve(42)
		const wrapped = cruel(fn)
		await wrapped()
		cruel.resetStats()
		expect(cruel.stats().calls).toBe(0)
	})
})

describe("cruel.seed", () => {
	test("makes randomness deterministic", async () => {
		cruel.seed(12345)
		const results1: boolean[] = []
		for (let i = 0; i < 10; i++) {
			results1.push(cruel.coin(0.5))
		}

		cruel.seed(12345)
		const results2: boolean[] = []
		for (let i = 0; i < 10; i++) {
			results2.push(cruel.coin(0.5))
		}

		expect(results1).toEqual(results2)
	})
})

describe("cruel.wrap", () => {
	test("provides fluent API", async () => {
		const fn = () => Promise.resolve(42)
		const wrapped = cruel.wrap(fn).slow(50)
		const start = Date.now()
		await wrapped()
		expect(Date.now() - start).toBeGreaterThanOrEqual(45)
	})
})

describe("cruel.maybe", () => {
	test("returns value or undefined", () => {
		cruel.seed(88888)
		const results = Array.from({ length: 100 }, () => cruel.maybe(42, 0.5))
		expect(results.some((r) => r === 42)).toBe(true)
		expect(results.some((r) => r === undefined)).toBe(true)
	})
})

describe("cruel.coin", () => {
	test("returns boolean based on rate", () => {
		cruel.seed(99999)
		const results = Array.from({ length: 100 }, () => cruel.coin(0.5))
		expect(results.filter(Boolean).length).toBeGreaterThan(20)
		expect(results.filter(Boolean).length).toBeLessThan(80)
	})
})

describe("cruel.pick", () => {
	test("picks random item from array", () => {
		cruel.seed(11111)
		const items = [1, 2, 3, 4, 5]
		const picked = cruel.pick(items)
		expect(items).toContain(picked)
	})
})

describe("cruel.between", () => {
	test("returns number in range", () => {
		cruel.seed(22222)
		const results = Array.from({ length: 100 }, () => cruel.between(10, 20))
		expect(results.every((r) => r >= 10 && r <= 20)).toBe(true)
	})
})

describe("cruel.delay", () => {
	test("delays execution", async () => {
		const start = Date.now()
		await cruel.delay(50)
		expect(Date.now() - start).toBeGreaterThanOrEqual(45)
	})
})

describe("cruel.presets", () => {
	test("has predefined presets", () => {
		expect(cruel.presets.development).toBeDefined()
		expect(cruel.presets.staging).toBeDefined()
		expect(cruel.presets.production).toBeDefined()
		expect(cruel.presets.harsh).toBeDefined()
		expect(cruel.presets.nightmare).toBeDefined()
		expect(cruel.presets.apocalypse).toBeDefined()
	})
})

describe("createCruel", () => {
	test("creates instance with defaults", async () => {
		const myCruel = createCruel({ delay: 50 })
		const fn = () => Promise.resolve(42)
		const wrapped = myCruel(fn)
		const start = Date.now()
		await wrapped()
		expect(Date.now() - start).toBeGreaterThanOrEqual(45)
	})
})

describe("cruel.circuitBreaker", () => {
	test("creates circuit breaker", () => {
		const fn = async () => "ok"
		const cb = cruel.circuitBreaker(fn, { threshold: 3, timeout: 1000 })
		expect(cb.getState().state).toBe("closed")
	})

	test("throws on invalid options", () => {
		const fn = async () => "ok"
		expect(() => cruel.circuitBreaker(fn, { threshold: 0, timeout: 1000 })).toThrow(CruelError)
		expect(() => cruel.circuitBreaker(fn, { threshold: 1, timeout: 0 })).toThrow(CruelError)
	})

	test("opens after threshold failures", async () => {
		let _calls = 0
		const fn = async () => {
			_calls++
			throw new Error("fail")
		}
		const cb = cruel.circuitBreaker(fn, { threshold: 2, timeout: 1000 })

		try {
			await cb()
		} catch {}
		expect(cb.getState().state).toBe("closed")

		try {
			await cb()
		} catch {}
		expect(cb.getState().state).toBe("open")
	})

	test("rejects when open", async () => {
		const fn = async () => {
			throw new Error("fail")
		}
		const cb = cruel.circuitBreaker(fn, { threshold: 1, timeout: 10000 })

		try {
			await cb()
		} catch {}
		await expect(cb()).rejects.toThrow("circuit breaker is open")
	})

	test("reset clears state", async () => {
		const fn = async () => {
			throw new Error("fail")
		}
		const cb = cruel.circuitBreaker(fn, { threshold: 1, timeout: 1000 })

		try {
			await cb()
		} catch {}
		expect(cb.getState().state).toBe("open")

		cb.reset()
		expect(cb.getState().state).toBe("closed")
	})

	test("resets failure count after success", async () => {
		let fail = true
		const fn = async () => {
			if (fail) throw new Error("fail")
			return "ok"
		}
		const cb = cruel.circuitBreaker(fn, { threshold: 2, timeout: 1000 })

		await expect(cb()).rejects.toThrow("fail")
		expect(cb.getState().failures).toBe(1)
		fail = false
		await expect(cb()).resolves.toBe("ok")
		expect(cb.getState().failures).toBe(0)
		fail = true
		await expect(cb()).rejects.toThrow("fail")
		expect(cb.getState().state).toBe("closed")
	})

	test("reopens from half-open after a single failure", async () => {
		const fn = async () => {
			throw new Error("fail")
		}
		const cb = cruel.circuitBreaker(fn, { threshold: 3, timeout: 20 })

		await expect(cb()).rejects.toThrow("fail")
		await expect(cb()).rejects.toThrow("fail")
		await expect(cb()).rejects.toThrow("fail")
		expect(cb.getState().state).toBe("open")

		await new Promise((r) => setTimeout(r, 30))
		await expect(cb()).rejects.toThrow("fail")
		expect(cb.getState().state).toBe("open")
	})
})

describe("cruel.retry", () => {
	test("throws on invalid attempts", () => {
		const fn = async () => "ok"
		expect(() => cruel.retry(fn, { attempts: 0 })).toThrow(CruelError)
		expect(() => cruel.retry(fn, { attempts: -1 })).toThrow(CruelError)
	})

	test("retries on failure", async () => {
		let attempts = 0
		const fn = async () => {
			attempts++
			if (attempts < 3) throw new Error("fail")
			return "ok"
		}
		const retryFn = cruel.retry(fn, { attempts: 3, delay: 10 })
		const result = await retryFn()
		expect(result).toBe("ok")
		expect(attempts).toBe(3)
	})

	test("throws after max attempts", async () => {
		const fn = async () => {
			throw new Error("always fail")
		}
		const retryFn = cruel.retry(fn, { attempts: 2, delay: 10 })
		await expect(retryFn()).rejects.toThrow("always fail")
	})

	test("exponential backoff", async () => {
		let attempts = 0
		const fn = async () => {
			attempts++
			if (attempts < 3) throw new Error("fail")
			return "ok"
		}
		const retryFn = cruel.retry(fn, {
			attempts: 3,
			delay: 10,
			backoff: "exponential",
		})
		const start = Date.now()
		await retryFn()
		expect(Date.now() - start).toBeGreaterThanOrEqual(25)
	})

	test("respects retryIf", async () => {
		let attempts = 0
		const fn = async () => {
			attempts++
			throw new Error("fatal")
		}
		const retryFn = cruel.retry(fn, {
			attempts: 3,
			delay: 10,
			retryIf: (e) => e.message !== "fatal",
		})
		await expect(retryFn()).rejects.toThrow("fatal")
		expect(attempts).toBe(1)
	})
})

describe("cruel.bulkhead", () => {
	test("limits concurrent executions", async () => {
		let concurrent = 0
		let maxConcurrent = 0
		const fn = async () => {
			concurrent++
			maxConcurrent = Math.max(maxConcurrent, concurrent)
			await new Promise((r) => setTimeout(r, 50))
			concurrent--
			return "ok"
		}
		const bulkhead = cruel.bulkhead(fn, { maxConcurrent: 2 })

		await Promise.all([bulkhead(), bulkhead(), bulkhead()])
		expect(maxConcurrent).toBeLessThanOrEqual(2)
	})

	test("queues excess requests", async () => {
		let calls = 0
		const fn = async () => {
			calls++
			await new Promise((r) => setTimeout(r, 20))
			return calls
		}
		const bulkhead = cruel.bulkhead(fn, { maxConcurrent: 1, maxQueue: 5 })

		const results = await Promise.all([bulkhead(), bulkhead(), bulkhead()])
		expect(results).toEqual([1, 2, 3])
	})

	test("rejects when queue full", async () => {
		const fn = async () => {
			await new Promise((r) => setTimeout(r, 100))
			return "ok"
		}
		const bulkhead = cruel.bulkhead(fn, { maxConcurrent: 1, maxQueue: 1 })

		const p1 = bulkhead()
		const p2 = bulkhead()
		const p3 = bulkhead()

		await expect(p3).rejects.toThrow("bulkhead queue full")
		await p1
		await p2
	})
})

describe("cruel.withTimeout", () => {
	test("throws on invalid timeout value", () => {
		const fn = async () => "ok"
		expect(() => cruel.withTimeout(fn, { ms: 0 })).toThrow(CruelError)
	})

	test("resolves before timeout", async () => {
		const fn = async () => {
			await new Promise((r) => setTimeout(r, 10))
			return "ok"
		}
		const timeoutFn = cruel.withTimeout(fn, { ms: 100 })
		const result = await timeoutFn()
		expect(result).toBe("ok")
	})

	test("throws on timeout", async () => {
		const fn = async () => {
			await new Promise((r) => setTimeout(r, 100))
			return "ok"
		}
		const timeoutFn = cruel.withTimeout(fn, { ms: 10 })
		await expect(timeoutFn()).rejects.toThrow(CruelTimeoutError)
	})
})

describe("cruel.fallback", () => {
	test("returns result on success", async () => {
		const fn = async (..._args: unknown[]) => "ok"
		const fallbackFn = cruel.fallback(fn, { fallback: "fallback" })
		const result = await fallbackFn()
		expect(result).toBe("ok")
	})

	test("returns fallback on failure", async () => {
		const fn = async (..._args: unknown[]) => {
			throw new Error("fail")
		}
		const fallbackFn = cruel.fallback(fn, { fallback: "fallback" })
		const result = await fallbackFn()
		expect(result).toBe("fallback")
	})

	test("calls fallback function", async () => {
		const fn = async (..._args: unknown[]) => {
			throw new Error("fail")
		}
		const fallbackFn = cruel.fallback(fn, { fallback: () => "computed" })
		const result = await fallbackFn()
		expect(result).toBe("computed")
	})
})

describe("cruel.hedge", () => {
	test("returns first successful result", async () => {
		let calls = 0
		const fn = async () => {
			const myCall = ++calls
			await new Promise((r) => setTimeout(r, myCall * 20))
			return `result-${myCall}`
		}
		const hedged = cruel.hedge(fn, { count: 3, delay: 10 })
		const result = await hedged()
		expect(result).toBe("result-1")
	})
})

describe("cruel.rateLimiter", () => {
	test("allows requests within limit", async () => {
		const fn = async () => "ok"
		const limited = cruel.rateLimiter(fn, { requests: 2, interval: 1000 })
		expect(await limited()).toBe("ok")
		expect(await limited()).toBe("ok")
	})

	test("rejects when limit exceeded", async () => {
		const fn = async () => "ok"
		const limited = cruel.rateLimiter(fn, { requests: 1, interval: 10000 })
		await limited()
		await expect(limited()).rejects.toThrow(CruelRateLimitError)
	})
})

describe("cruel.cache", () => {
	test("caches results", async () => {
		let calls = 0
		const fn = async (...args: unknown[]) => {
			calls++
			return (args[0] as number) * 2
		}
		const cached = cruel.cache(fn, { ttl: 10000 })
		expect(await cached(5)).toBe(10)
		expect(await cached(5)).toBe(10)
		expect(calls).toBe(1)
	})

	test("expires cache after ttl", async () => {
		let calls = 0
		const fn = async () => {
			calls++
			return calls
		}
		const cached = cruel.cache(fn, { ttl: 50 })
		expect(await cached()).toBe(1)
		await new Promise((r) => setTimeout(r, 60))
		expect(await cached()).toBe(2)
	})
})

describe("cruel.on", () => {
	test("registers event handler", async () => {
		const events: string[] = []
		const off = cruel.on((e) => events.push(e.type))
		const fn = cruel(async () => "ok")
		await fn()
		expect(events.includes("call")).toBe(true)
		expect(events.includes("success")).toBe(true)
		expect(typeof off).toBe("function")
		off()
	})

	test("removes handler when called", async () => {
		const events: string[] = []
		const off = cruel.on((e) => events.push(e.type))
		off()
		const fn = cruel(async () => "ok")
		await fn()
		expect(events.length).toBe(0)
		cruel.removeAllListeners()
	})

	test("emits retry and circuit events", async () => {
		const events: string[] = []
		const off = cruel.on((e) => events.push(e.type))
		const fn = async () => {
			throw new Error("fail")
		}
		const retryFn = cruel.retry(fn, { attempts: 2, delay: 1 })
		await expect(retryFn()).rejects.toThrow("fail")
		const breaker = cruel.circuitBreaker(fn, { threshold: 1, timeout: 1000 })
		await expect(breaker()).rejects.toThrow("fail")
		expect(events.includes("retry")).toBe(true)
		expect(events.includes("circuitOpen")).toBe(true)
		off()
	})
})

describe("cruel.abort", () => {
	test("throws when signal already aborted", async () => {
		const controller = new AbortController()
		controller.abort()
		const fn = async () => "ok"
		const abortable = cruel.abort(fn, { signal: controller.signal })
		await expect(abortable()).rejects.toThrow("operation aborted")
	})

	test("completes when not aborted", async () => {
		const controller = new AbortController()
		const fn = async () => "ok"
		const abortable = cruel.abort(fn, { signal: controller.signal })
		expect(await abortable()).toBe("ok")
	})
})

describe("cruel.compose", () => {
	test("composes multiple policies", async () => {
		const fn = async () => "ok"
		const composed = cruel.compose(fn, {
			retry: { attempts: 2, delay: 10 },
			cache: { ttl: 1000 },
		})
		expect(await composed()).toBe("ok")
	})

	test("supports timeoutMs in compose", async () => {
		const fn = async () => {
			await new Promise((r) => setTimeout(r, 100))
			return "ok"
		}
		const composed = cruel.compose(fn, { timeoutMs: 10 })
		await expect(composed()).rejects.toThrow(CruelTimeoutError)
	})

	test("keeps timeout as chaos probability", async () => {
		const fn = async () => "ok"
		const composed = cruel.compose(fn, { timeout: 1 })
		let resolved = false
		composed().then(() => {
			resolved = true
		})
		await new Promise((r) => setTimeout(r, 50))
		expect(resolved).toBe(false)
	})

	test("treats timeout > 1 as timeout ms for compatibility", async () => {
		const fn = async () => {
			await new Promise((r) => setTimeout(r, 100))
			return "ok"
		}
		const composed = cruel.compose(fn, { timeout: 10 })
		await expect(composed()).rejects.toThrow(CruelTimeoutError)
	})
})

describe("errors", () => {
	test("CruelError has code", () => {
		const err = new CruelError("test", "TEST_CODE")
		expect(err.code).toBe("TEST_CODE")
	})

	test("CruelTimeoutError", () => {
		const err = new CruelTimeoutError()
		expect(err.code).toBe("CRUEL_TIMEOUT")
	})

	test("CruelNetworkError has type in code", () => {
		const err = new CruelNetworkError("disconnect")
		expect(err.code).toBe("CRUEL_NETWORK_DISCONNECT")
	})

	test("CruelHttpError has status", () => {
		const err = new CruelHttpError(500)
		expect(err.status).toBe(500)
	})

	test("CruelRateLimitError has retryAfter", () => {
		const err = new CruelRateLimitError(60)
		expect(err.retryAfter).toBe(60)
		expect(err.status).toBe(429)
	})

	test("CruelAIError has type", () => {
		const err = new CruelAIError("rate_limit")
		expect(err.type).toBe("rate_limit")
	})
})
