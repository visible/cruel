import "dotenv/config"
import { APICallError } from "ai"

const red = "\x1b[31m"
const dim = "\x1b[2m"
const reset = "\x1b[0m"

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
				if (error.responseBody) {
					console.log(`  ${dim}body${reset}    ${typeof error.responseBody === "string" ? error.responseBody.slice(0, 200) : error.responseBody}`)
				}
			}
			console.log(`\n  ${dim}\u2500 ${ms}ms${reset}`)
		})
}
