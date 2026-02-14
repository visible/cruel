import "dotenv/config"
import { APICallError } from "ai"
import { dim, red, reset } from "./colors"

process.on("unhandledRejection", () => {})

export function run(fn: () => Promise<void>) {
	const start = performance.now()
	fn()
		.then(() => {
			const ms = Math.round(performance.now() - start)
			console.log(`\n  ${dim}\u2500 ${ms}ms${reset}`)
		})
		.catch((error) => {
			const ms = Math.round(performance.now() - start)
			console.log()
			console.log(`  ${red}\u2717${reset} ${red}${error.message}${reset}`)
			if (APICallError.isInstance(error)) {
				console.log(`  ${dim}status${reset}  ${error.statusCode}`)
				console.log(`  ${dim}retry${reset}   ${error.isRetryable}`)
			}
			console.log(`\n  ${dim}\u2500 ${ms}ms${reset}`)
		})
}
