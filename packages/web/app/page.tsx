import { CursorFrontier } from "../components/landing/cursor-bento"
import { CursorFeatures } from "../components/landing/cursor-features"
import { CursorFooter } from "../components/landing/cursor-footer"
import { CursorHero } from "../components/landing/cursor-hero"
import { CursorNav } from "../components/landing/cursor-nav"

export default function Page() {
	return (
		<main className="cursor-landing relative isolate min-h-screen bg-[#100E0E] text-white selection:bg-white/20 selection:text-white">
			<div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden md:block">
				<div className="mx-auto h-full max-w-[1320px] border-x border-x-white/14" />
			</div>
			<div className="relative z-10">
				<CursorNav />
				<CursorHero />
				<CursorFeatures />
				<CursorFrontier />
				<CursorFooter />
			</div>
		</main>
	)
}
