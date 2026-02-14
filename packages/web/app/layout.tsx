import { RootProvider } from "fumadocs-ui/provider/next"
import { GeistMono } from "geist/font/mono"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
	title: "cruel",
	description: "chaos testing with zero mercy",
	metadataBase: new URL("https://cruel.dev"),
	openGraph: {
		title: "cruel",
		description: "chaos testing with zero mercy",
		url: "https://cruel.dev",
		siteName: "cruel",
		type: "website",
	},
	twitter: {
		card: "summary",
		title: "cruel",
		description: "chaos testing with zero mercy",
	},
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={`${GeistMono.variable} dark`}>
			<body className="font-mono antialiased bg-[#f5f3ef]">
				<RootProvider
					theme={{ defaultTheme: "dark", enabled: false }}
					search={{
						options: {
							api: "/api/search",
						},
					}}
				>
					{children}
				</RootProvider>
			</body>
		</html>
	)
}
