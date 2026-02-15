import { defineConfig } from "tsup"

export default defineConfig([
	{
		entry: ["src/index.ts", "src/ai-sdk.ts", "src/matchers.ts"],
		format: ["esm", "cjs"],
		dts: true,
		clean: true,
		minify: true,
	},
	{
		entry: ["src/cli.ts"],
		format: ["esm"],
		clean: false,
		minify: true,
		banner: { js: "#!/usr/bin/env node" },
	},
])
