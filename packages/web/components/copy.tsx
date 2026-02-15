"use client"

import { ArrowUp, Check, Copy as Duplicate } from "lucide-react"
import { useState } from "react"

type copyprops = {
	text: string
}

export function Copy({ text }: copyprops) {
	const [copied, setcopied] = useState(false)

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

	return (
		<div className="mt-3 flex items-center gap-1.5">
			<button
				type="button"
				onClick={copy}
				aria-label={copied ? "markdown copied" : "copy markdown"}
				title={copied ? "copied" : "copy markdown"}
				className="inline-flex h-8 w-8 items-center justify-center text-white/42 hover:text-white/82 transition-colors"
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
				className="inline-flex h-8 w-8 items-center justify-center text-white/42 hover:text-white/82 transition-colors"
			>
				<ArrowUp aria-hidden="true" className="h-4 w-4" />
			</button>
		</div>
	)
}
