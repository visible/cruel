export function resolve(fallback: string): string {
	const override = process.env.MODEL
	if (!override) return fallback
	if (fallback.includes("/")) return `${fallback.split("/")[0]}/${override}`
	return override
}
