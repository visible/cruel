import { cruel } from "cruel"
import { print } from "../lib/print"
import { run } from "../lib/run"

run(async () => {
	cruel.reset()
	const task = async (id: string) => ({ id, ok: true })
	const api = cruel(task, {
		fail: 0,
		delay: [40, 80],
		timeout: 0,
	})
	const data = await api("demo")
	print("result", data)
	print("stats", cruel.stats())
})
