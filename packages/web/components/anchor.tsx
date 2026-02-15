"use client"

import { useEffect } from "react"

export function Anchor() {
	useEffect(() => {
		const page = document.getElementById("nd-page")
		if (!page) return
		const timers = new WeakMap<HTMLAnchorElement, number>()

		function copy(event: MouseEvent) {
			const node = event.target
			if (!(node instanceof Element)) return

			const link = node.closest("h2 > a.peer, h3 > a.peer, h4 > a.peer, h5 > a.peer, h6 > a.peer")
			if (!(link instanceof HTMLAnchorElement)) return

			const hash = link.getAttribute("href")
			if (!hash || !hash.startsWith("#")) return

			event.preventDefault()

			const url = new URL(window.location.href)
			url.hash = hash.slice(1)
			void navigator.clipboard.writeText(url.toString())

			const timer = timers.get(link)
			if (timer) window.clearTimeout(timer)
			link.dataset.copied = "true"

			const next = window.setTimeout(() => {
				delete link.dataset.copied
				timers.delete(link)
			}, 1200)

			timers.set(link, next)
		}

		page.addEventListener("click", copy)
		return () => page.removeEventListener("click", copy)
	}, [])

	return null
}
