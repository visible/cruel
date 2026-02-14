import {
	type ChaosOptions,
	type CircuitBreakerOptions,
	createCruel,
	cruel,
	type RetryOptions,
	type WrapOptions,
} from "../src/index"

type equal<a, b> = (<t>() => t extends a ? 1 : 2) extends <t>() => t extends b ? 1 : 2
	? true
	: false
type extend<a, b> = [a] extends [b] ? true : false

const verify = <t extends true>() => true as t

declare const task: (id: string) => Promise<{ id: string }>

const core = cruel(task, { fail: 0.1 })
const retry = cruel.retry(task, { attempts: 2, delay: 10 })
const breaker = cruel.circuitBreaker(task, { threshold: 2, timeout: 1000 })
const maker = createCruel({ delay: 10 })
const made = maker(task)
const stack = cruel.compose(task, {
	retry: { attempts: 2, delay: 10 },
	circuitBreaker: { threshold: 2, timeout: 1000 },
	fallback: { id: "fallback" },
})

const one = verify<equal<ChaosOptions["fail"], number | undefined>>()
const two = verify<extend<WrapOptions["retry"], RetryOptions | undefined>>()
const three = verify<extend<WrapOptions["circuitBreaker"], CircuitBreakerOptions | undefined>>()
const four = verify<equal<Parameters<typeof core>, [id: string]>>()
const five = verify<equal<ReturnType<typeof core>, Promise<{ id: string }>>>()
const six = verify<equal<ReturnType<typeof retry>, Promise<{ id: string }>>>()
const seven =
	verify<extend<ReturnType<typeof breaker.getState>, { state: "closed" | "open" | "half-open" }>>()
const eight = verify<equal<ReturnType<typeof made>, Promise<{ id: string }>>>()
const nine = verify<equal<Awaited<ReturnType<typeof stack>>, { id: string }>>()

void [one, two, three, four, five, six, seven, eight, nine]
