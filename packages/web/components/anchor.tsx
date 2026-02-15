"use client"

import { useEffect } from "react"

export function Anchor() {
	useEffect(() => {
		const page = document.getElementById("nd-page")
		if (!(page instanceof HTMLElement)) return
		const root = page
		const timers = new WeakMap<HTMLAnchorElement, number>()
		const icons = new WeakMap<SVGSVGElement, string>()

		function find(node: Element): HTMLAnchorElement | null {
			const direct = node.closest("h2 > a.peer, h3 > a.peer, h4 > a.peer, h5 > a.peer, h6 > a.peer")
			if (direct instanceof HTMLAnchorElement) return direct

			const icon = node.closest("h2 > svg, h3 > svg, h4 > svg, h5 > svg, h6 > svg")
			if (!(icon instanceof SVGSVGElement)) return null

			const sibling = icon.previousElementSibling
			if (!(sibling instanceof HTMLAnchorElement)) return null
			if (!sibling.matches("a.peer")) return null
			return sibling
		}

		function mark(link: HTMLAnchorElement) {
			const icon = link.nextElementSibling
			if (!(icon instanceof SVGSVGElement)) return
			const heading = link.parentElement

			const current = icons.get(icon) ?? icon.innerHTML
			if (!icons.has(icon)) icons.set(icon, current)

			link.dataset.copied = "true"
			icon.innerHTML =
				'<path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>'

			const timer = window.setTimeout(() => {
				let reveal = false
				if (heading instanceof HTMLElement) {
						const frame = root.getBoundingClientRect()
					const rect = heading.getBoundingClientRect()
					const visible =
						rect.bottom > frame.top &&
						rect.top < frame.bottom &&
						rect.right > frame.left &&
						rect.left < frame.right
					reveal = visible && heading.matches(":hover")
					if (!reveal) heading.dataset.lock = "true"
				}

				const value = icons.get(icon)
				if (value) icon.innerHTML = value
				delete link.dataset.copied

				if (heading instanceof HTMLElement && !reveal) {
					heading.addEventListener(
						"pointerenter",
						() => {
							delete heading.dataset.lock
						},
						{ once: true },
					)
				}
			}, 1200)

			const previous = timers.get(link)
			if (previous) window.clearTimeout(previous)
			timers.set(link, timer)
		}

		function copy(event: MouseEvent) {
			const node = event.target
			if (!(node instanceof Element)) return

			const link = find(node)
			if (!link) return

			const hash = link.getAttribute("href")
			if (!hash || !hash.startsWith("#")) return

			event.preventDefault()

			const url = new URL(window.location.href)
			url.hash = hash.slice(1)
			void navigator.clipboard.writeText(url.toString())
			mark(link)
			link.blur()
		}

		root.addEventListener("click", copy)
		return () => root.removeEventListener("click", copy)
	}, [])

	return null
}
