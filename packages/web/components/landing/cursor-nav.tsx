"use client"

import { Github } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export function CursorNav() {
	const [scrolled, setScrolled] = useState(false)

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 20)
		}
		window.addEventListener("scroll", handleScroll)
		return () => window.removeEventListener("scroll", handleScroll)
	}, [])

	return (
		<nav className="fixed top-0 left-0 right-0 z-50">
			<div className="mx-auto max-w-[1320px]">
				<div
					className={`flex h-16 items-center justify-between border-x border-b px-6 transition-colors duration-200 ${
						scrolled
							? "border-x-white/14 border-b-white/8 bg-[#100E0E]"
							: "border-x-transparent border-b-transparent bg-transparent"
					}`}
				>
					<div className="flex items-center">
						<Link href="/" className="flex items-center gap-2 text-white">
							<svg viewBox="0 0 32 32" className="size-6 text-[#f1ecde]" fill="none" aria-hidden="true">
								<line x1="16" y1="4" x2="16" y2="28" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
								<line x1="4" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
								<line x1="7.5" y1="7.5" x2="24.5" y2="24.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
								<line x1="24.5" y1="7.5" x2="7.5" y2="24.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
							</svg>
							<span className="text-sm font-semibold tracking-tight">Cruel</span>
						</Link>
					</div>

					<div className="flex items-center gap-6">
						<Link href="/docs" className="text-sm text-white/60 hover:text-white transition-colors">
							Docs
						</Link>
						<Link href="/story" className="text-sm text-white/60 hover:text-white transition-colors">
							Story
						</Link>
						<a
							href="https://github.com/visible/cruel"
							target="_blank"
							rel="noopener noreferrer"
							aria-label="GitHub"
							className="inline-flex size-9 items-center justify-center text-white/65 hover:text-white transition-colors"
						>
							<Github className="size-4" />
						</a>
					</div>
				</div>
			</div>
		</nav>
	)
}
