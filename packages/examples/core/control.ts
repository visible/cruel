import { cruel } from "cruel"
import { print } from "../lib/print"
import { run } from "../lib/run"

run(async () => {
	cruel.reset()
	cruel.seed(7)
	cruel.enable(cruel.presets.development)
	const task = async () => "ok"
	const api = cruel(task, { fail: 0 })
	const one = await api()
	const two = await cruel.scope(
		async () => {
			const scoped = cruel(task, { delay: [20, 40], fail: 0 })
			return scoped()
		},
		{ fail: 0, delay: [10, 20] },
	)
	cruel.disable()
	print("enabled", cruel.isEnabled())
	print("result", { one, two })
})
