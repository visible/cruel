import { LandingFrontier } from "../components/landing/landing-bento"
import { LandingFeatures } from "../components/landing/landing-features"
import { LandingFooter } from "../components/landing/landing-footer"
import { LandingHero } from "../components/landing/landing-hero"
import { LandingNav } from "../components/landing/landing-nav"

export default function Page() {
	return (
		<main className="landing relative isolate min-h-screen bg-[#100E0E] text-white selection:bg-white/20 selection:text-white">
			<div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden md:block">
				<div className="mx-auto h-full max-w-[1320px] border-x border-x-white/14" />
			</div>
			<div className="relative z-10">
				<LandingNav />
				<LandingHero />
				<LandingFeatures />
				<LandingFrontier />
				<LandingFooter />
			</div>
		</main>
	)
}
