import { readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { spawn } from "node:child_process"
import { dim, cyan, green, red, reset } from "./lib/colors"

const root = import.meta.dirname
const args = process.argv.slice(2)

let model: string | undefined
const filters: string[] = []

for (let i = 0; i < args.length; i++) {
	if ((args[i] === "--model" || args[i] === "-m") && args[i + 1]) {
		model = args[++i]
	} else {
		filters.push(args[i])
	}
}

if (filters.length === 0) {
	console.log(`\n  ${cyan}usage${reset}  bun run run.ts <filters...> [-m model]\n`)
	console.log(`  ${dim}by provider${reset}`)
	console.log(`    bun run run.ts openai`)
	console.log(`    bun run run.ts anthropic`)
	console.log()
	console.log(`  ${dim}by category + provider${reset}`)
	console.log(`    bun run run.ts ai-gateway openai`)
	console.log(`    bun run run.ts ai-sdk anthropic`)
	console.log()
	console.log(`  ${dim}with custom model${reset}`)
	console.log(`    bun run run.ts ai-gateway openai -m gpt-5`)
	console.log(`    bun run run.ts ai-sdk groq -m llama-3.3-70b-versatile`)
	console.log()
	console.log(`  ${dim}by type${reset}`)
	console.log(`    bun run run.ts heavy`)
	console.log(`    bun run run.ts with-tools`)
	console.log(`    bun run run.ts with-diagnostics`)
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

const modelTag = model ? ` ${dim}(model: ${model})${reset}` : ""
console.log(`\n  ${cyan}\u25b8${reset} ${matches.length} examples matching "${filters.join(" ")}"${modelTag}\n`)

for (const file of matches) {
	const rel = relative(root, file)
	console.log(`  ${dim}\u2500\u2500\u2500 ${rel} \u2500\u2500\u2500${reset}\n`)

	const env = { ...process.env }
	if (model) env.MODEL = model

	const child = spawn("bun", ["run", file], {
		cwd: root,
		stdio: "inherit",
		env,
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
