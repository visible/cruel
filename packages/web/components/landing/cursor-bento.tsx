import Link from "next/link"

type item = {
	readonly id: string
	readonly title: string
	readonly body: string
	readonly href: string
	readonly label: string
}

const items: readonly item[] = [
	{
		id: "001",
		title: "Chaos presets",
		body: "Start from realistic presets, then tune options per provider, model, or API.",
		href: "/docs/chaos",
		label: "Read chaos",
	},
	{
		id: "002",
		title: "Core and AI SDK",
		body: "Wrap fetch and async functions with cruel(...), or wrap providers and models with cruel/ai-sdk.",
		href: "/docs/core",
		label: "Read core api",
	},
	{
		id: "003",
		title: "Stream drills",
		body: "Test slow tokens, chunk corruption, and stream cuts before shipping UI.",
		href: "/docs/chaos",
		label: "Read streaming",
	},
	{
		id: "004",
		title: "CI replay",
		body: "Seed chaos once and replay deterministic sequences in every pipeline.",
		href: "/docs/advanced",
		label: "Read replay",
	},
]

function mark(index: number) {
	if (index === 0) {
		return (
			<div className="grid grid-cols-3 gap-1" aria-hidden="true">
				<span className="size-2 border border-white/30" />
				<span className="size-2 border border-white/30" />
				<span className="size-2 border border-white/30" />
				<span className="size-2 border border-white/30" />
				<span className="size-2 border border-white/30" />
				<span className="size-2 border border-white/30" />
				<span className="size-2 border border-white/30" />
				<span className="size-2 border border-white/30" />
				<span className="size-2 border border-white/30" />
			</div>
		)
	}

	if (index === 1) {
		return (
			<div className="flex items-center gap-1" aria-hidden="true">
				<span className="size-2 border border-white/30" />
				<span className="size-2 border border-white/30" />
				<span className="size-2 border border-white/30" />
				<span className="size-2 border border-white/30" />
			</div>
		)
	}

	if (index === 2) {
		return (
			<div className="flex flex-col gap-1" aria-hidden="true">
				<span className="h-1 w-8 border border-white/30" />
				<span className="h-1 w-6 border border-white/30" />
				<span className="h-1 w-4 border border-white/30" />
			</div>
		)
	}

	return (
		<div className="relative h-6 w-8" aria-hidden="true">
			<span className="absolute top-0 left-0 size-2 border border-white/30" />
			<span className="absolute top-0 right-0 size-2 border border-white/30" />
			<span className="absolute bottom-0 left-1/2 size-2 -translate-x-1/2 border border-white/30" />
		</div>
	)
}

export function CursorFrontier() {
	return (
		<section>
			<div className="mx-auto max-w-[1320px] border-t border-white/5 px-6 py-20 md:py-28">
				<div className="grid gap-10 border-b border-white/8 pb-12 md:grid-cols-[1.2fr_0.8fr] md:pb-14">
					<div>
						<h2 className="text-balance text-4xl font-semibold tracking-tighter text-white md:text-6xl leading-[1.05]">
							Chaos infrastructure that ships.
						</h2>
					</div>
					<div className="md:pt-2">
						<p className="max-w-md text-pretty text-base leading-relaxed text-[#9a9a9a]">
							We focus on production-grade failure simulation for AI apps and async backends, not
							synthetic demos.
						</p>
						<div className="mt-6">
							<Link
								href="/docs/advanced#production-rollout-checklist"
								className="inline-flex items-center gap-2 border border-white/12 px-4 py-2 text-sm font-medium text-white/85 transition-colors hover:border-white/25 hover:text-white"
							>
								Open workflow
								<span aria-hidden="true">→</span>
							</Link>
						</div>
					</div>
				</div>

				<div className="grid md:grid-cols-2 lg:grid-cols-4">
					{items.map((item, index) => (
						<article
							key={item.id}
							className={`flex h-full flex-col border-b border-white/8 py-8 md:px-6 md:py-9 ${
								index % 2 === 1 ? "md:border-l" : ""
							} ${index >= 2 ? "md:border-b-0" : ""} ${
								index > 0 ? "lg:border-l" : "lg:border-l-0"
							} lg:border-b-0`}
						>
							<div className="font-mono text-[11px] text-white/35">{item.id}</div>
							<div className="mt-7 flex h-10 items-center">{mark(index)}</div>
							<h3 className="mt-7 text-2xl font-semibold tracking-tighter text-white text-balance">
								{item.title}
							</h3>
							<p className="mt-4 flex-1 text-pretty text-sm leading-relaxed text-[#9a9a9a]">
								{item.body}
							</p>
							<div className="mt-6">
								<Link
									href={item.href}
									className="inline-flex items-center gap-1.5 text-sm font-medium text-(--cursor-accent) hover:opacity-80 transition-opacity"
								>
									{item.label} <span aria-hidden="true">→</span>
								</Link>
							</div>
						</article>
					))}
				</div>
			</div>
		</section>
	)
}
