import type { Metadata } from "next"
import { CursorNav } from "../../components/landing/cursor-nav"

const intro = [
	"3am. Phone buzzes. Production alert. Something is wrong, but not with our code - our code is perfect. Passed every test, every lint check, every code review. The problem? The AI provider started rate limiting us and our retry logic had a subtle bug that nobody ever caught. Because in development, the API never fails.",
	"Users see a blank screen. Classic.",
	"This happened more than once. Different projects, different providers, same pattern. Everything works beautifully in development. The streams flow smoothly, the tokens arrive one by one, the JSON parses clean, the error boundaries sit there looking pretty, completely untested against real failures.",
	"Then you deploy and the real world introduces itself.",
	"Rate limits hit during your busiest hour. Streams cut mid-sentence on your longest responses. Structured output comes back with malformed JSON. Context length errors surface only on conversations from your most engaged users - the ones you really don't want to lose. Content filters trigger on inputs nobody on the team ever thought to test against.",
	"And it's not any one provider's fault. This is just the nature of building on top of AI APIs. Every provider - whether it's OpenAI, Anthropic, Google, Mistral, Cohere, or anyone else - has their own failure modes, their own error formats, their own rate limit behaviors. They're all doing incredible work pushing the boundaries of what's possible. But distributed systems fail. That's not a bug, it's physics.",
	"The question isn't whether your AI integration will encounter failures in production. The question is whether you've tested what happens when it does.",
] as const

type part = {
	readonly title: string
	readonly text: readonly string[]
}

const parts: readonly part[] = [
	{
		title: "The Duct Tape Era",
		text: [
			"For the longest time, my approach to this problem was embarrassingly manual. Need to test a rate limit? Hardcode a mock response that returns a 429. Need to test a stream cut? Write a custom readable stream that stops halfway through. Need to test a timeout? Add a setTimeout that never resolves.",
			'Copy and paste between projects. Slightly different each time. Never quite matching the real error format. Always incomplete. Always the thing I\'d "get to later" and never actually finish.',
			"And honestly? Most of the time I just skipped it entirely. Shipped the code, crossed my fingers, and hoped that the error handling I wrote based on reading the docs would actually work when a real failure hit.",
			"Spoiler: reading the docs is not the same as testing against real failures.",
			"The retry logic that looks correct in a code review? It doesn't respect the retry-after header. The stream error handler that catches the right error type? It doesn't clean up the partial response in the UI. The circuit breaker pattern you implemented from that blog post? It's never actually been tripped.",
			"You don't know if your parachute works until you jump. And we were all jumping without ever testing the chute.",
		],
	},
	{
		title: "The Idea",
		text: [
			"I work on the AI SDK team at Vercel. It's an incredible team - Lars, Nico, and everyone else shipping tools that millions of developers use every day. Being part of this team means I get to see how AI integrations work across the entire ecosystem. Every provider, every framework, every edge case.",
			"And I kept seeing the same pattern: developers build amazing AI features, test them against the happy path, ship to production, and then discover their error handling has gaps when real-world chaos hits.",
			"The AI SDK already does incredible work abstracting away provider differences. Unified API, streaming support, structured output, tool calling - all the hard parts handled cleanly. But the one thing no SDK can do for you is test your app's resilience against failures that only happen in production.",
			'That\'s when it clicked. What if there was a library that could simulate every failure mode you\'d encounter in production? Not mocking the entire API - just wrapping your existing code with configurable chaos. Tell it "fail 10% of the time" or "add random latency" or "cut the stream halfway through" and let your error handling prove itself.',
			"Not a mock. Not a test framework. Just chaos. Realistic, configurable, provider-accurate chaos that works with anything async.",
		],
	},
	{
		title: "Building It",
		text: [
			"The core took a weekend. Wrap any async function, inject failures at a configurable rate, add random latency between two bounds, occasionally just... never resolve. The fundamentals of chaos in about 200 lines of TypeScript.",
			"Then came the network simulation layer. Packet loss, DNS failures, disconnects, slow connections. Then HTTP chaos - status codes, rate limits, server errors. Then stream manipulation - cuts, pauses, corruption, truncation. Each layer building on the core but targeting specific failure domains.",
			"The AI SDK integration is where it got really interesting. I didn't want generic failures - I wanted failures that match real provider behavior exactly. When Cruel simulates a rate limit, it returns the correct status code with a realistic retry-after header. When it simulates an overloaded error, the error object has the right shape, the right properties, the right behavior that the AI SDK's retry system expects.",
			"This means your error handling code sees exactly what it would see from a real provider failure. No surprises in production because you already tested against the real thing - or at least something indistinguishable from it.",
			"Then resilience patterns. Circuit breaker, retry with backoff, bulkhead isolation, timeout wrappers, fallbacks. Not because Cruel is trying to be a resilience library - there are great ones already - but because when you're chaos testing, you want to verify these patterns actually work under pressure.",
			"Zero dependencies. I was obsessive about this one. No runtime deps means no supply chain risk, no version conflicts, no transitive dependency nightmares. Just TypeScript and your code. Install it, import it, use it. Nothing else comes along for the ride.",
		],
	},
	{
		title: "The Name",
		text: [
			'I thought about this for longer than I\'d like to admit. Tested a bunch of names. "chaos-inject" felt corporate. "fault-line" felt geological. "havoc" was taken.',
			"Then I just thought about what chaos testing should feel like. It should be uncomfortable. It should break things you thought were solid. It should find the bugs you didn't know existed. It should be relentless and thorough and completely without sympathy for your assumptions.",
			"It should be Cruel.",
			"That's the whole philosophy in one word. If your tests are gentle, your production failures will be brutal. Better to find out now - in development, with a stack trace and a debugger and a cup of coffee - than at 3am from a production alert while your users watch a loading spinner that never stops.",
		],
	},
	{
		title: "What's Next",
		text: [
			"Cruel is open source and I'm building it in public. The core is stable, the AI SDK integration works, the resilience patterns are solid. But there's so much more to do.",
			"Better test matchers. More realistic failure scenarios. Deeper integration with Vitest and Jest. Maybe a visual dashboard that shows you exactly how your app behaves under different chaos profiles. Provider-specific failure libraries that evolve as the APIs evolve.",
			"If you're building AI apps and you've ever been bitten by a production failure you didn't test for, give Cruel a try. Break things on purpose. Find the bugs before your users do.",
			"And if you find a failure mode I haven't thought of yet, open an issue. The cruelest ideas come from real production pain.",
			"Zero mercy.",
		],
	},
] as const

export const metadata: Metadata = {
	title: "Story - Cruel",
	description: "Why I Built Cruel",
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
								Why I Built Cruel
							</h1>
							<div className="mt-4 text-sm text-white/40">February 2026</div>

							<div className="mt-10 space-y-5 text-[16px] leading-[1.85] text-white/64">
								{intro.map((line) => (
									<p key={line}>{line}</p>
								))}
							</div>

							<div className="mt-14 space-y-14 md:space-y-16">
								{parts.map((item) => (
									<section key={item.title}>
										<h2 className="text-3xl font-semibold text-white tracking-tight">
											{item.title}
										</h2>
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
