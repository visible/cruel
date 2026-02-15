import { cruel } from "cruel"
import { print } from "../lib/print"
import { run } from "../lib/run"

run(async () => {
	cruel.reset()
	let count = 0
	const task = async () => {
		count++
		if (count < 3) throw new Error("flaky")
		return { count }
	}
	const api = cruel.compose(task, {
		retry: { attempts: 4, delay: 20, backoff: "linear" },
		circuitBreaker: { threshold: 3, timeout: 1000 },
		fallback: { count: -1 },
	})
	const data = await api()
	print("result", data)
	print("attempts", count)
})
