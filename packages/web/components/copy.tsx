"use client"

import { ArrowUp, Check, Copy as Duplicate, Link } from "lucide-react"
import { useState } from "react"

type copyprops = {
	text: string
}

export function Copy({ text }: copyprops) {
	const [copied, setcopied] = useState(false)
	const [linked, setlinked] = useState(false)

	async function copy() {
		if (!text) return
		await navigator.clipboard.writeText(text)
		setcopied(true)
		setTimeout(() => setcopied(false), 1200)
	}

	function top() {
		const page = document.getElementById("nd-page")
		if (page) {
			page.scrollTo({ top: 0, behavior: "smooth" })
			return
		}
		window.scrollTo({ top: 0, behavior: "smooth" })
	}

	async function link() {
		await navigator.clipboard.writeText(window.location.href)
		setlinked(true)
		setTimeout(() => setlinked(false), 1200)
	}

	return (
		<div className="mt-3 flex items-center gap-1.5">
			<button
				type="button"
				onClick={copy}
				aria-label={copied ? "markdown copied" : "copy markdown"}
				title={copied ? "copied" : "copy markdown"}
				className="inline-flex h-9 w-9 items-center justify-center text-white/42 transition-colors hover:text-white/82"
			>
				{copied ? (
					<Check aria-hidden="true" className="h-4 w-4" />
				) : (
					<Duplicate aria-hidden="true" className="h-4 w-4" />
				)}
			</button>
			<button
				type="button"
				onClick={top}
				aria-label="scroll to top"
				title="scroll to top"
				className="inline-flex h-9 w-9 items-center justify-center text-white/42 transition-colors hover:text-white/82"
			>
				<ArrowUp aria-hidden="true" className="h-4 w-4" />
			</button>
			<button
				type="button"
				onClick={link}
				aria-label={linked ? "page link copied" : "copy page link"}
				title={linked ? "copied" : "copy page link"}
				className="inline-flex h-9 w-9 items-center justify-center text-white/42 transition-colors hover:text-white/82"
			>
				{linked ? (
					<Check aria-hidden="true" className="h-4 w-4" />
				) : (
					<Link aria-hidden="true" strokeWidth={2.2} className="h-[18px] w-[18px]" />
				)}
			</button>
		</div>
	)
}
