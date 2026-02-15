import { createMDX } from "fumadocs-mdx/next"
import type { NextConfig } from "next"

const config: NextConfig = {
	turbopack: {
		resolveAlias: {
			"fumadocs-mdx:collections/server": "./.source/server",
			"fumadocs-mdx:collections/browser": "./.source/browser",
			"fumadocs-mdx:collections/dynamic": "./.source/dynamic",
		},
	},
}

const withMDX = createMDX()

export default withMDX(config)
