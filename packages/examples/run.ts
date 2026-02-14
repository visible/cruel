import { readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { spawn } from "node:child_process"

const dim = "\x1b[2m"
const cyan = "\x1b[36m"
const green = "\x1b[32m"
const red = "\x1b[31m"
const reset = "\x1b[0m"

const root = import.meta.dirname
const filter = process.argv[2]

if (!filter) {
	console.log(`\n  ${cyan}usage${reset}  bun run run.ts <filter>\n`)
	console.log(`  ${dim}examples${reset}`)
	console.log(`    bun run run.ts openai      ${dim}all openai examples${reset}`)
	console.log(`    bun run run.ts google       ${dim}all google examples${reset}`)
	console.log(`    bun run run.ts heavy        ${dim}all heavy/stress tests${reset}`)
	console.log(`    bun run run.ts ai-sdk       ${dim}all ai-sdk examples${reset}`)
	console.log(`    bun run run.ts ai-gateway   ${dim}all ai-gateway examples${reset}`)
	console.log(`    bun run run.ts stream-text  ${dim}all stream-text examples${reset}`)
	console.log()
	process.exit(0)
}

function collect(dir: string): string[] {
	const files: string[] = []
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry)
		if (entry === "node_modules" || entry === "lib") continue
		if (statSync(full).isDirectory()) {
			files.push(...collect(full))
		} else if (entry.endsWith(".ts") && entry !== "run.ts") {
			files.push(full)
		}
	}
	return files
}

const all = collect(root)
const matches = all.filter((f) => {
	const rel = relative(root, f)
	return rel.includes(filter)
})

if (matches.length === 0) {
	console.log(`\n  ${red}\u2717${reset} no examples match "${filter}"\n`)
	process.exit(1)
}

console.log(`\n  ${cyan}\u25b8${reset} ${matches.length} examples matching "${filter}"\n`)

for (const file of matches) {
	const rel = relative(root, file)
	console.log(`  ${dim}\u2500\u2500\u2500 ${rel} \u2500\u2500\u2500${reset}\n`)

	const child = spawn("bun", ["run", file], {
		cwd: root,
		stdio: "inherit",
		env: { ...process.env },
	})

	const code = await new Promise<number>((resolve) => {
		child.on("close", (c) => resolve(c ?? 0))
	})

	if (code === 0) {
		console.log(`\n  ${green}\u2713${reset} ${dim}${rel}${reset}\n`)
	} else {
		console.log(`\n  ${red}\u2717${reset} ${dim}${rel} (exit ${code})${reset}\n`)
	}
}
