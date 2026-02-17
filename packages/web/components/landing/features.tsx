export function Features() {
	const features = [
		{
			title: "Network Chaos",
			description: "Simulate latency, packet loss, and disconnections.",
			icon: (
				<svg
					className="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={1.5}
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12h1.5m1.5 0h9m-9 0h-1.5m1.5 0l2.25-2.25m-2.25 2.25l2.25 2.25m-6 0h1.5m-1.5 0l2.25 2.25m-2.25-2.25l-2.25 2.25"
					/>
				</svg>
			),
		},
		{
			title: "HTTP Failures",
			description: "Inject 4xx/5xx errors, rate limits, and timeouts.",
			icon: (
				<svg
					className="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={1.5}
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
					/>
				</svg>
			),
		},
		{
			title: "Stream Interruption",
			description: "Cut streams, pause chunks, and corrupt data.",
			icon: (
				<svg
					className="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={1.5}
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
					/>
				</svg>
			),
		},
		{
			title: "AI Specific",
			description: "Test token limits, context overflow, and hallucinations.",
			icon: (
				<svg
					className="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={1.5}
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
					/>
				</svg>
			),
		},
	]

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{features.map((feature) => (
				<div
					key={feature.title}
					className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-6 transition-colors hover:border-white/20 hover:bg-white/10"
				>
					<div className="mb-4 text-white/70 transition-colors group-hover:text-white">
						{feature.icon}
					</div>
					<h3 className="mb-2 text-sm font-medium text-white">{feature.title}</h3>
					<p className="text-xs text-white/50">{feature.description}</p>
					<div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/5 blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />
				</div>
			))}
		</div>
	)
}
