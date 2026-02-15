import { Analytics } from "@vercel/analytics/react"
import { RootProvider } from "fumadocs-ui/provider/next"
import { GeistMono } from "geist/font/mono"
import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
	title: "cruel",
	description: "chaos testing with zero mercy",
	metadataBase: new URL("https://cruel.dev"),
	icons: {
		icon: "/icon.svg",
		apple: "/apple-icon.png",
	},
	openGraph: {
		title: "cruel",
		description: "chaos testing with zero mercy",
		url: "https://cruel.dev",
		siteName: "cruel",
		type: "website",
		images: [
			{
				url: "/og.png",
				width: 1200,
				height: 630,
				alt: "cruel",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "cruel",
		description: "chaos testing with zero mercy",
		images: ["/og.png"],
	},
}

export const viewport: Viewport = {
	themeColor: "#0a0a0a",
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
				<Analytics />
			</body>
		</html>
	)
}
