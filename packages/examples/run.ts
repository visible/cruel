import { spawn } from "node:child_process"
import { readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { cyan, dim, green, red, reset } from "./lib/colors"

const root = import.meta.dirname
const args = process.argv.slice(2)
const filters: string[] = []
let model: string | undefined

for (let i = 0; i < args.length; i++) {
	const arg = args[i]
	if (arg === "-m" || arg === "--model") {
		model = args[i + 1]
		i++
		continue
	}
	if (arg.startsWith("--model=")) {
		model = arg.slice("--model=".length)
		continue
	}
	filters.push(arg)
}

if ((args.includes("-m") || args.includes("--model")) && !model) {
	console.log(`\n  ${red}\u2717${reset} missing model id after -m/--model\n`)
	process.exit(1)
}
if (model !== undefined && model.length === 0) {
	console.log(`\n  ${red}\u2717${reset} missing model id after --model=\n`)
	process.exit(1)
}

if (filters.length === 0) {
	console.log(`\n  ${cyan}usage${reset}  bun run run.ts <filters...> [-m <model>]\n`)
	console.log(`  ${dim}by provider${reset}`)
	console.log(`    bun run run.ts openai`)
	console.log(`    bun run run.ts anthropic`)
	console.log()
	console.log(`  ${dim}by category + provider${reset}`)
	console.log(`    bun run run.ts ai-gateway openai`)
	console.log(`    bun run run.ts ai-sdk anthropic`)
	console.log()
	console.log(`  ${dim}by function + provider${reset}`)
	console.log(`    bun run run.ts stream-text google`)
	console.log(`    bun run run.ts generate-text xai`)
	console.log()
	console.log(`  ${dim}by type${reset}`)
	console.log(`    bun run run.ts heavy`)
	console.log(`    bun run run.ts with-tools`)
	console.log(`    bun run run.ts with-diagnostics`)
	console.log()
	console.log(`  ${dim}model override${reset}`)
	console.log(`    bun run run.ts ai-sdk openai -m gpt-6`)
	console.log(`    bun run run.ts ai-gateway openai --model gpt-6`)
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
	return filters.every((filter) => rel.includes(filter))
})

if (matches.length === 0) {
	console.log(`\n  ${red}\u2717${reset} no examples match "${filters.join(" ")}"\n`)
	process.exit(1)
}

console.log(
	`\n  ${cyan}\u25b8${reset} ${matches.length} examples matching "${filters.join(" ")}"\n`,
)
if (model) {
	console.log(`  ${cyan}\u25b8${reset} model override "${model}"\n`)
}

for (const file of matches) {
	const rel = relative(root, file)
	console.log(`  ${dim}\u2500\u2500\u2500 ${rel} \u2500\u2500\u2500${reset}\n`)

	const child = spawn("bun", ["run", file], {
		cwd: root,
		stdio: "inherit",
		env: model ? { ...process.env, MODEL: model } : { ...process.env },
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
