import { dim, cyan, reset } from "./colors"

function clean(value: unknown): unknown {
	if (value == null || typeof value !== "object") return value
	if (Array.isArray(value)) return value.map(clean)
	return Object.fromEntries(
		Object.entries(value)
			.filter(([, v]) => v != null)
			.map(([k, v]) => [k, clean(v)]),
	)
}

export function print(label: string, value: unknown) {
	const cleaned = clean(value)
	if (typeof cleaned === "string" || typeof cleaned === "number" || typeof cleaned === "boolean") {
		console.log(`  ${cyan}\u25b8${reset} ${dim}${label}${reset} ${cleaned}`)
		return
	}
	console.log(`  ${cyan}\u25b8${reset} ${dim}${label}${reset}`)
	console.dir(cleaned, { depth: Infinity, colors: true })
}
