import type { Metadata } from "next"
import { CursorNav } from "../../components/landing/cursor-nav"

const intro = [
	"3am. phone buzzes. production alert. something is wrong, but not with our code - our code is perfect. passed every test, every lint check, every code review. the problem? the ai provider started rate limiting us and our retry logic had a subtle bug that nobody ever caught. because in development, the api never fails.",
	"users see a blank screen. classic.",
	"this happened more than once. different projects, different providers, same pattern. everything works beautifully in development. the streams flow smoothly, the tokens arrive one by one, the json parses clean, the error boundaries sit there looking pretty, completely untested against real failures.",
	"then you deploy and the real world introduces itself.",
	"rate limits hit during your busiest hour. streams cut mid-sentence on your longest responses. structured output comes back with malformed json. context length errors surface only on conversations from your most engaged users - the ones you really don't want to lose. content filters trigger on inputs nobody on the team ever thought to test against.",
	"and it's not any one provider's fault. this is just the nature of building on top of ai apis. every provider - whether it's openai, anthropic, google, mistral, cohere, or anyone else - has their own failure modes, their own error formats, their own rate limit behaviors. they're all doing incredible work pushing the boundaries of what's possible. but distributed systems fail. that's not a bug, it's physics.",
	"the question isn't whether your ai integration will encounter failures in production. the question is whether you've tested what happens when it does.",
] as const

type part = {
	readonly title: string
	readonly text: readonly string[]
}

const parts: readonly part[] = [
	{
		title: "the duct tape era",
		text: [
			"for the longest time, my approach to this problem was embarrassingly manual. need to test a rate limit? hardcode a mock response that returns a 429. need to test a stream cut? write a custom readable stream that stops halfway through. need to test a timeout? add a setTimeout that never resolves.",
			"copy and paste between projects. slightly different each time. never quite matching the real error format. always incomplete. always the thing i'd \"get to later\" and never actually finish.",
			"and honestly? most of the time i just skipped it entirely. shipped the code, crossed my fingers, and hoped that the error handling i wrote based on reading the docs would actually work when a real failure hit.",
			"spoiler: reading the docs is not the same as testing against real failures.",
			"the retry logic that looks correct in a code review? it doesn't respect the retry-after header. the stream error handler that catches the right error type? it doesn't clean up the partial response in the ui. the circuit breaker pattern you implemented from that blog post? it's never actually been tripped.",
			"you don't know if your parachute works until you jump. and we were all jumping without ever testing the chute.",
		],
	},
	{
		title: "the idea",
		text: [
			"i work on the ai sdk team at vercel. it's an incredible team - lars, nico, and everyone else shipping tools that millions of developers use every day. being part of this team means i get to see how ai integrations work across the entire ecosystem. every provider, every framework, every edge case.",
			"and i kept seeing the same pattern: developers build amazing ai features, test them against the happy path, ship to production, and then discover their error handling has gaps when real-world chaos hits.",
			"the ai sdk already does incredible work abstracting away provider differences. unified api, streaming support, structured output, tool calling - all the hard parts handled cleanly. but the one thing no sdk can do for you is test your app's resilience against failures that only happen in production.",
			"that's when it clicked. what if there was a library that could simulate every failure mode you'd encounter in production? not mocking the entire api - just wrapping your existing code with configurable chaos. tell it \"fail 10% of the time\" or \"add random latency\" or \"cut the stream halfway through\" and let your error handling prove itself.",
			"not a mock. not a test framework. just chaos. realistic, configurable, provider-accurate chaos that works with anything async.",
		],
	},
	{
		title: "building it",
		text: [
			"the core took a weekend. wrap any async function, inject failures at a configurable rate, add random latency between two bounds, occasionally just... never resolve. the fundamentals of chaos in about 200 lines of typescript.",
			"then came the network simulation layer. packet loss, dns failures, disconnects, slow connections. then http chaos - status codes, rate limits, server errors. then stream manipulation - cuts, pauses, corruption, truncation. each layer building on the core but targeting specific failure domains.",
			"the ai sdk integration is where it got really interesting. i didn't want generic failures - i wanted failures that match real provider behavior exactly. when cruel simulates a rate limit, it returns the correct status code with a realistic retry-after header. when it simulates an overloaded error, the error object has the right shape, the right properties, the right behavior that the ai sdk's retry system expects.",
			"this means your error handling code sees exactly what it would see from a real provider failure. no surprises in production because you already tested against the real thing - or at least something indistinguishable from it.",
			"then resilience patterns. circuit breaker, retry with backoff, bulkhead isolation, timeout wrappers, fallbacks. not because cruel is trying to be a resilience library - there are great ones already - but because when you're chaos testing, you want to verify these patterns actually work under pressure.",
			"zero dependencies. i was obsessive about this one. no runtime deps means no supply chain risk, no version conflicts, no transitive dependency nightmares. just typescript and your code. install it, import it, use it. nothing else comes along for the ride.",
		],
	},
	{
		title: "the name",
		text: [
			"i thought about this for longer than i'd like to admit. tested a bunch of names. \"chaos-inject\" felt corporate. \"fault-line\" felt geological. \"havoc\" was taken.",
			"then i just thought about what chaos testing should feel like. it should be uncomfortable. it should break things you thought were solid. it should find the bugs you didn't know existed. it should be relentless and thorough and completely without sympathy for your assumptions.",
			"it should be cruel.",
			"that's the whole philosophy in one word. if your tests are gentle, your production failures will be brutal. better to find out now - in development, with a stack trace and a debugger and a cup of coffee - than at 3am from a production alert while your users watch a loading spinner that never stops.",
		],
	},
	{
		title: "what's next",
		text: [
			"cruel is open source and i'm building it in public. the core is stable, the ai sdk integration works, the resilience patterns are solid. but there's so much more to do.",
			"better test matchers. more realistic failure scenarios. deeper integration with vitest and jest. maybe a visual dashboard that shows you exactly how your app behaves under different chaos profiles. provider-specific failure libraries that evolve as the apis evolve.",
			"if you're building ai apps and you've ever been bitten by a production failure you didn't test for, give cruel a try. break things on purpose. find the bugs before your users do.",
			"and if you find a failure mode i haven't thought of yet, open an issue. the cruelest ideas come from real production pain.",
			"zero mercy.",
		],
	},
] as const

export const metadata: Metadata = {
	title: "story - cruel",
	description: "why i built cruel",
}

export default function Page() {
	return (
		<main className="cursor-landing relative isolate min-h-screen bg-[#100E0E] text-white selection:bg-white/20 selection:text-white">
			<div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden md:block">
				<div className="mx-auto h-full max-w-[1320px] border-x border-x-white/14" />
			</div>

			<div className="relative z-10">
				<CursorNav />

				<section className="pt-28 pb-20 md:pt-36 md:pb-28">
					<div className="mx-auto max-w-[1320px] px-6">
						<article className="min-w-0 pt-8 md:pt-10">
							<h1 className="text-5xl font-semibold leading-[1.03] text-white tracking-tighter sm:text-6xl md:text-7xl">
								why i built cruel
							</h1>
							<div className="mt-4 text-sm text-white/40">february 2026</div>

							<div className="mt-10 space-y-5 text-[16px] leading-[1.85] text-white/64">
								{intro.map((line) => (
									<p key={line}>{line}</p>
								))}
							</div>

							<div className="mt-14 space-y-14 md:space-y-16">
								{parts.map((item) => (
									<section key={item.title}>
										<h2 className="text-3xl font-semibold text-white tracking-tight">{item.title}</h2>
										<div className="mt-5 space-y-5 text-[16px] leading-[1.85] text-white/64">
											{item.text.map((line) => (
												<p key={line}>{line}</p>
											))}
										</div>
									</section>
								))}
							</div>
						</article>
					</div>
				</section>
			</div>
		</main>
	)
}
