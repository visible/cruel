export function resolve(fallback: string): string {
	const override = process.env.MODEL
	if (!override) return fallback
	if (fallback.includes("/")) {
		const parts = fallback.split("/")
		return `${parts.slice(0, -1).join("/")}/${override}`
	}
	return override
}
