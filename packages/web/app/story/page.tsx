import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
	title: "story - cruel",
	description: "why i built cruel",
}

export default function Page() {
	return (
		<main className="h-dvh bg-[#f5f3ef] p-[var(--docs-pad)] overflow-hidden">
			<div className="relative rounded-[var(--panel-radius)] border border-white/10 overflow-hidden h-full flex flex-col">
				<div className="panel-bg absolute inset-0" />
				<div className="grain absolute inset-0 pointer-events-none" />
				<div className="hidden sm:block absolute inset-[10px] rounded-[calc(var(--panel-radius)-6px)] border border-white/[0.06] pointer-events-none z-20" />

				<div className="relative z-10 flex-1 overflow-y-auto">
					<div className="sticky top-0 z-10 max-w-[520px] mx-auto px-5 sm:px-6 pt-4 sm:pt-5 pb-2">
						<nav className="flex items-center justify-between h-9 px-4 rounded-full border border-white/[0.06] bg-white/[0.04] backdrop-blur-md text-[11px]">
							<Link href="/" className="text-white/40 hover:text-white/70 transition-colors">
								cruel
							</Link>
							<div className="flex items-center gap-4">
								<Link href="/docs" className="text-white/30 hover:text-white/60 transition-colors">
									docs
								</Link>
								<span className="text-white/50">story</span>
							</div>
						</nav>
					</div>

					<article className="max-w-[520px] mx-auto px-5 sm:px-6 pt-8 sm:pt-12 pb-16 sm:pb-24">
						<div className="flex flex-col gap-3 mb-10 sm:mb-14">
							<h1 className="text-[24px] sm:text-[28px] font-bold leading-[1] tracking-[-0.03em] text-white/90">
								why i built cruel
							</h1>
							<p className="text-[11px] text-white/20 italic">february 2026</p>
						</div>

						<div className="flex flex-col gap-6 text-[13px] sm:text-[13.5px] text-white/35 leading-[1.7]">
							<p>
								3am. phone buzzes. production alert. something is wrong, but not with our code - our
								code is perfect. passed every test, every lint check, every code review. the
								problem? the ai provider started rate limiting us and our retry logic had a subtle
								bug that nobody ever caught. because in development, the api never fails.
							</p>

							<p>users see a blank screen. classic.</p>

							<p>
								this happened more than once. different projects, different providers, same pattern.
								everything works beautifully in development. the streams flow smoothly, the tokens
								arrive one by one, the json parses clean, the error boundaries sit there looking
								pretty, completely untested against real failures.
							</p>

							<p>then you deploy and the real world introduces itself.</p>

							<p>
								rate limits hit during your busiest hour. streams cut mid-sentence on your longest
								responses. structured output comes back with malformed json. context length errors
								surface only on conversations from your most engaged users - the ones you really
								don't want to lose. content filters trigger on inputs nobody on the team ever
								thought to test against.
							</p>

							<p>
								and it's not any one provider's fault. this is just the nature of building on top of
								ai apis. every provider - whether it's openai, anthropic, google, mistral, cohere,
								or anyone else - has their own failure modes, their own error formats, their own
								rate limit behaviors. they're all doing incredible work pushing the boundaries of
								what's possible. but distributed systems fail. that's not a bug, it's physics.
							</p>

							<p>
								the question isn't whether your ai integration will encounter failures in
								production. the question is whether you've tested what happens when it does.
							</p>

							<h2 className="text-[16px] sm:text-[17px] font-semibold text-white/65 tracking-[-0.01em] mt-6">
								the duct tape era
							</h2>

							<p>
								for the longest time, my approach to this problem was embarrassingly manual. need to
								test a rate limit? hardcode a mock response that returns a 429. need to test a
								stream cut? write a custom readable stream that stops halfway through. need to test
								a timeout? add a setTimeout that never resolves.
							</p>

							<p>
								copy and paste between projects. slightly different each time. never quite matching
								the real error format. always incomplete. always the thing i'd "get to later" and
								never actually finish.
							</p>

							<p>
								and honestly? most of the time i just skipped it entirely. shipped the code, crossed
								my fingers, and hoped that the error handling i wrote based on reading the docs
								would actually work when a real failure hit.
							</p>

							<p>spoiler: reading the docs is not the same as testing against real failures.</p>

							<p>
								the retry logic that looks correct in a code review? it doesn't respect the
								retry-after header. the stream error handler that catches the right error type? it
								doesn't clean up the partial response in the ui. the circuit breaker pattern you
								implemented from that blog post? it's never actually been tripped.
							</p>

							<p>
								you don't know if your parachute works until you jump. and we were all jumping
								without ever testing the chute.
							</p>

							<h2 className="text-[16px] sm:text-[17px] font-semibold text-white/65 tracking-[-0.01em] mt-6">
								the idea
							</h2>

							<p>
								i work on the ai sdk team at vercel. it's an incredible team - lars, nico, and
								everyone else shipping tools that millions of developers use every day. being part
								of this team means i get to see how ai integrations work across the entire
								ecosystem. every provider, every framework, every edge case.
							</p>

							<p>
								and i kept seeing the same pattern: developers build amazing ai features, test them
								against the happy path, ship to production, and then discover their error handling
								has gaps when real-world chaos hits.
							</p>

							<p>
								the ai sdk already does incredible work abstracting away provider differences.
								unified api, streaming support, structured output, tool calling - all the hard parts
								handled cleanly. but the one thing no sdk can do for you is test your app's
								resilience against failures that only happen in production.
							</p>

							<p>
								that's when it clicked. what if there was a library that could simulate every
								failure mode you'd encounter in production? not mocking the entire api - just
								wrapping your existing code with configurable chaos. tell it "fail 10% of the time"
								or "add random latency" or "cut the stream halfway through" and let your error
								handling prove itself.
							</p>

							<p>
								not a mock. not a test framework. just chaos. realistic, configurable,
								provider-accurate chaos that works with anything async.
							</p>

							<h2 className="text-[16px] sm:text-[17px] font-semibold text-white/65 tracking-[-0.01em] mt-6">
								building it
							</h2>

							<p>
								the core took a weekend. wrap any async function, inject failures at a configurable
								rate, add random latency between two bounds, occasionally just... never resolve. the
								fundamentals of chaos in about 200 lines of typescript.
							</p>

							<p>
								then came the network simulation layer. packet loss, dns failures, disconnects, slow
								connections. then http chaos - status codes, rate limits, server errors. then stream
								manipulation - cuts, pauses, corruption, truncation. each layer building on the core
								but targeting specific failure domains.
							</p>

							<p>
								the ai sdk integration is where it got really interesting. i didn't want generic
								failures - i wanted failures that match real provider behavior exactly. when cruel
								simulates a rate limit, it returns the correct status code with a realistic
								retry-after header. when it simulates an overloaded error, the error object has the
								right shape, the right properties, the right behavior that the ai sdk's retry system
								expects.
							</p>

							<p>
								this means your error handling code sees exactly what it would see from a real
								provider failure. no surprises in production because you already tested against the
								real thing - or at least something indistinguishable from it.
							</p>

							<p>
								then resilience patterns. circuit breaker, retry with backoff, bulkhead isolation,
								timeout wrappers, fallbacks. not because cruel is trying to be a resilience library
								- there are great ones already - but because when you're chaos testing, you want to
								verify these patterns actually work under pressure.
							</p>

							<p>
								zero dependencies. i was obsessive about this one. no runtime deps means no supply
								chain risk, no version conflicts, no transitive dependency nightmares. just
								typescript and your code. install it, import it, use it. nothing else comes along
								for the ride.
							</p>

							<h2 className="text-[16px] sm:text-[17px] font-semibold text-white/65 tracking-[-0.01em] mt-6">
								the name
							</h2>

							<p>
								i thought about this for longer than i'd like to admit. tested a bunch of names.
								"chaos-inject" felt corporate. "fault-line" felt geological. "havoc" was taken.
							</p>

							<p>
								then i just thought about what chaos testing should feel like. it should be
								uncomfortable. it should break things you thought were solid. it should find the
								bugs you didn't know existed. it should be relentless and thorough and completely
								without sympathy for your assumptions.
							</p>

							<p>it should be cruel.</p>

							<p>
								that's the whole philosophy in one word. if your tests are gentle, your production
								failures will be brutal. better to find out now - in development, with a stack trace
								and a debugger and a cup of coffee - than at 3am from a production alert while your
								users watch a loading spinner that never stops.
							</p>

							<h2 className="text-[16px] sm:text-[17px] font-semibold text-white/65 tracking-[-0.01em] mt-6">
								what's next
							</h2>

							<p>
								cruel is open source and i'm building it in public. the core is stable, the ai sdk
								integration works, the resilience patterns are solid. but there's so much more to
								do.
							</p>

							<p>
								better test matchers. more realistic failure scenarios. deeper integration with
								vitest and jest. maybe a visual dashboard that shows you exactly how your app
								behaves under different chaos profiles. provider-specific failure libraries that
								evolve as the apis evolve.
							</p>

							<p>
								if you're building ai apps and you've ever been bitten by a production failure you
								didn't test for, give cruel a try. break things on purpose. find the bugs before
								your users do.
							</p>

							<p>
								and if you find a failure mode i haven't thought of yet, open an issue. the cruelest
								ideas come from real production pain.
							</p>

							<p className="text-white/20 italic mt-6">zero mercy.</p>
						</div>
					</article>
				</div>
			</div>
		</main>
	)
}
