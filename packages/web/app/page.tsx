import Link from "next/link"

const code = `import { cruel } from "cruel"

const api = cruel(fetch, {
  fail: 0.1,
  delay: [100, 500],
  timeout: 0.05,
})

const res = await api("https://api.example.com")`

export default function Page() {
	return (
		<main className="h-dvh bg-[#f5f3ef] flex items-center justify-center p-[var(--docs-pad)]">
			<div className="relative w-full h-full rounded-[var(--panel-radius)] border border-white/10 overflow-hidden">
				<div className="panel-bg absolute inset-0" />
				<div className="grain absolute inset-0 pointer-events-none" />
				<div className="hidden sm:block absolute inset-[10px] rounded-[calc(var(--panel-radius)-6px)] border border-white/[0.06] pointer-events-none" />
				<div className="sm:hidden absolute bottom-14 right-5 z-10">
					<Star />
				</div>

				<div className="relative z-10 h-full grid grid-rows-[1fr_auto]">
					<div className="flex flex-col sm:grid sm:grid-cols-[1fr_auto] p-5 sm:p-8 pt-6 sm:pt-10">
						<div className="flex flex-col justify-between gap-8 sm:gap-0">
							<div className="flex flex-col gap-4 sm:gap-5">
								<div className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-medium">
									chaos engineering
								</div>
								<h1 className="text-[clamp(48px,12vw,96px)] font-bold leading-[0.88] tracking-[-0.045em] text-white/90">
									cruel
								</h1>
								<p className="text-[13px] leading-[1.55] text-white/35 max-w-[260px] mt-1">
									inject failures, latency, and timeouts into any async function. works with fetch,
									ai sdks, databases, anything.
								</p>
							</div>

							<div className="hidden sm:block">
								<pre className="text-[11px] leading-[1.75] font-mono">
									{code.split("\n").map((line, i) => (
										<div key={`${i}-${line}`}>{tokenize(line)}</div>
									))}
								</pre>
							</div>
						</div>

						<div className="flex flex-row sm:flex-col justify-between sm:justify-between items-start sm:items-end">
							<nav className="flex flex-row sm:flex-col items-start sm:items-end gap-3 sm:gap-2.5 sm:mt-2">
								{[
									{ href: "/docs", label: "Docs", ext: false },
									{ href: "/story", label: "Story", ext: false },
									{ href: "https://github.com/visible/cruel", label: "Github", ext: true },
									{ href: "https://www.npmjs.com/package/cruel", label: "npm", ext: true },
								].map((l) => {
									const cls =
										"text-[13px] text-white/45 underline decoration-white/15 underline-offset-[3px] decoration-[1px] hover:text-white/80 hover:decoration-white/40 transition-all duration-300"
									return l.ext ? (
										<a
											key={l.label}
											href={l.href}
											target="_blank"
											rel="noopener noreferrer"
											className={cls}
										>
											{l.label}
										</a>
									) : (
										<Link key={l.label} href={l.href} className={cls}>
											{l.label}
										</Link>
									)
								})}
							</nav>

							<div className="hidden sm:block">
								<Star />
							</div>
						</div>
					</div>

					<div className="mx-2 sm:mx-[10px] mb-2 sm:mb-[10px] rounded-b-[calc(var(--panel-radius)-8px)] border-t border-white/[0.06] h-[44px] sm:h-[48px] flex items-center justify-between px-4 sm:px-5 text-[11px] sm:text-[12px]">
						<div className="text-white/20 italic">v1.0.1</div>
						<div className="text-white/35 select-all cursor-text">
							<span className="text-white/15 select-none">$ </span>
							bun add cruel
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}

function Star() {
	return (
		<div className="relative w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] opacity-[0.12]">
			<div className="absolute inset-0 m-auto w-px h-full bg-white" />
			<div className="absolute inset-0 m-auto w-full h-px bg-white" />
			<div className="absolute inset-0 m-auto w-px h-full bg-white rotate-45" />
			<div className="absolute inset-0 m-auto w-full h-px bg-white rotate-45" />
		</div>
	)
}

function tokenize(line: string): React.ReactNode {
	if (!line.trim()) return "\u00A0"

	const out: React.ReactNode[] = []
	let rest = line
	let k = 0

	const rules: [RegExp, string][] = [
		[/^(import|from|const|await)\b/, "text-white/20"],
		[/[{}[\]()]/, "text-white/12"],
		[/"[^"]*"/, "text-white/40"],
		[/\b(cruel|fetch)\b/, "text-white/70"],
		[/\b\d+(\.\d+)?\b/, "text-white/30"],
		[/[:,.]/, "text-white/12"],
		[/=/, "text-white/15"],
	]

	while (rest.length > 0) {
		let hit: { i: number; n: number; c: string } | null = null
		for (const [re, c] of rules) {
			const m = rest.match(re)
			if (m?.index !== undefined && (!hit || m.index < hit.i)) {
				hit = { i: m.index, n: m[0].length, c }
			}
		}
		if (!hit) {
			out.push(
				<span key={k++} className="text-white/22">
					{rest}
				</span>,
			)
			break
		}
		if (hit.i > 0)
			out.push(
				<span key={k++} className="text-white/22">
					{rest.slice(0, hit.i)}
				</span>,
			)
		out.push(
			<span key={k++} className={hit.c}>
				{rest.slice(hit.i, hit.i + hit.n)}
			</span>,
		)
		rest = rest.slice(hit.i + hit.n)
	}

	return out
}
