import { cruel } from "./index.js";

const args = process.argv.slice(2);
const command = args[0];

const colors = {
	red: (s: string) => `\x1b[31m${s}\x1b[0m`,
	green: (s: string) => `\x1b[32m${s}\x1b[0m`,
	blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
	cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
	magenta: (s: string) => `\x1b[35m${s}\x1b[0m`,
	dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
	yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
	bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

function logo() {
	console.log(`
${colors.red("  ▄████▄  ██▀███  █    ██ ▓█████  ██▓    ")}
${colors.red(" ▒██▀ ▀█ ▓██ ▒ ██▒██  ▓██▒▓█   ▀ ▓██▒    ")}
${colors.red(" ▒▓█    ▄▓██ ░▄█ ▓██  ▒██░▒███   ▒██░    ")}
${colors.red(" ▒▓▓▄ ▄██▒██▀▀█▄ ▓▓█  ░██░▒▓█  ▄ ▒██░    ")}
${colors.red(" ▒ ▓███▀ ░██▓ ▒██▒▒█████▓ ░▒████▒░██████▒")}
${colors.red(" ░ ░▒ ▒  ░ ▒▓ ░▒▓░▒▓▒ ▒ ▒ ░░ ▒░ ░░ ▒░▓  ░")}
${colors.dim("   chaos testing with zero mercy")}
`);
}

function help() {
	logo();
	console.log(`
${colors.bold("usage:")} cruel <command> [options]

${colors.bold("commands:")}
  ${colors.green("test")} <url>        test endpoint with chaos injection
  ${colors.green("benchmark")} <url>   benchmark endpoint performance
  ${colors.green("scenario")} <name>   run predefined chaos scenario
  ${colors.green("stats")}             show chaos statistics
  ${colors.green("presets")}           list available presets
  ${colors.green("version")}           show version

${colors.bold("options:")}
  --fail <rate>      failure rate (0-1)
  --delay <ms>       delay in ms or min-max
  --timeout <rate>   timeout rate (0-1)
  --duration <ms>    scenario duration
  --preset <name>    use a preset config
  --count <n>        number of requests
  --concurrent <n>   concurrent requests
  --retry <n>        retry attempts
  --circuit <n>      circuit breaker threshold

${colors.bold("examples:")}
  cruel test https://api.example.com --fail 0.1 --count 20
  cruel test https://api.example.com --preset nightmare
  cruel benchmark https://api.example.com --count 100 --concurrent 10
  cruel scenario outage --duration 5000

${colors.bold("presets:")}
  development, staging, production, harsh, nightmare, apocalypse

${colors.bold("scenarios:")}
  networkPartition, highLatency, degraded, outage, recovery
`);
}

function parseArgs(args: string[]): Record<string, string | number | boolean> {
	const result: Record<string, string | number | boolean> = {};
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg.startsWith("--")) {
			const key = arg.slice(2);
			const next = args[i + 1];
			if (next && !next.startsWith("--")) {
				const num = parseFloat(next);
				result[key] = Number.isNaN(num) ? next : num;
				i++;
			} else {
				result[key] = true;
			}
		} else if (!result._target) {
			result._target = arg;
		}
	}
	return result;
}

function formatMs(ms: number): string {
	if (ms < 1000) return `${Math.round(ms)}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

function percentile(arr: number[], p: number): number {
	const sorted = [...arr].sort((a, b) => a - b);
	const idx = Math.ceil((p / 100) * sorted.length) - 1;
	return sorted[Math.max(0, idx)];
}

async function testEndpoint(
	url: string,
	opts: Record<string, string | number | boolean>,
) {
	const count = (opts.count as number) || 10;
	const preset = opts.preset as string;
	const retryAttempts = opts.retry as number;
	const circuitThreshold = opts.circuit as number;

	let chaosOpts = {};
	if (preset && preset in cruel.presets) {
		chaosOpts = cruel.presets[preset as keyof typeof cruel.presets];
	} else {
		chaosOpts = {
			fail: opts.fail as number,
			delay: opts.delay as number,
			timeout: opts.timeout as number,
		};
	}

	console.log(colors.yellow(`\ntesting ${url}`));
	console.log(colors.dim(`requests: ${count}`));
	console.log(colors.dim(`config: ${JSON.stringify(chaosOpts)}`));
	if (retryAttempts)
		console.log(colors.dim(`retry: ${retryAttempts} attempts`));
	if (circuitThreshold)
		console.log(colors.dim(`circuit breaker: ${circuitThreshold} threshold`));
	console.log();

	let fetchFn: typeof fetch = cruel(fetch, chaosOpts) as typeof fetch;

	if (retryAttempts) {
		fetchFn = cruel.retry(fetchFn, {
			attempts: retryAttempts,
			delay: 100,
			backoff: "exponential",
		}) as typeof fetch;
	}

	if (circuitThreshold) {
		const cb = cruel.circuitBreaker(fetchFn, {
			threshold: circuitThreshold,
			timeout: 10000,
		});
		fetchFn = cb as typeof fetch;
	}

	let success = 0;
	let failed = 0;
	let timeouts = 0;
	const times: number[] = [];

	for (let i = 0; i < count; i++) {
		const start = Date.now();
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000);

			await fetchFn(url, { signal: controller.signal });
			clearTimeout(timeoutId);

			const time = Date.now() - start;
			times.push(time);
			success++;
			process.stdout.write(colors.green("."));
		} catch (e) {
			const err = e as Error;
			if (err.name === "AbortError" || err.message.includes("timeout")) {
				timeouts++;
				process.stdout.write(colors.yellow("T"));
			} else {
				failed++;
				process.stdout.write(colors.red("X"));
			}
		}
	}

	const avg = times.length
		? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
		: 0;
	const min = times.length ? Math.min(...times) : 0;
	const max = times.length ? Math.max(...times) : 0;
	const p50 = times.length ? percentile(times, 50) : 0;
	const p95 = times.length ? percentile(times, 95) : 0;
	const p99 = times.length ? percentile(times, 99) : 0;

	console.log(`\n\n${colors.bold("results:")}`);
	console.log(
		`  ${colors.green("success:")} ${success}/${count} (${Math.round((success / count) * 100)}%)`,
	);
	console.log(
		`  ${colors.red("failed:")} ${failed}/${count} (${Math.round((failed / count) * 100)}%)`,
	);
	console.log(
		`  ${colors.yellow("timeouts:")} ${timeouts}/${count} (${Math.round((timeouts / count) * 100)}%)`,
	);
	console.log(`\n${colors.bold("latency:")}`);
	console.log(`  ${colors.dim("avg:")} ${formatMs(avg)}`);
	console.log(`  ${colors.dim("min:")} ${formatMs(min)}`);
	console.log(`  ${colors.dim("max:")} ${formatMs(max)}`);
	console.log(`  ${colors.cyan("p50:")} ${formatMs(p50)}`);
	console.log(`  ${colors.cyan("p95:")} ${formatMs(p95)}`);
	console.log(`  ${colors.cyan("p99:")} ${formatMs(p99)}`);
}

async function benchmark(
	url: string,
	opts: Record<string, string | number | boolean>,
) {
	const count = (opts.count as number) || 100;
	const concurrent = (opts.concurrent as number) || 10;

	console.log(colors.yellow(`\nbenchmarking ${url}`));
	console.log(colors.dim(`requests: ${count}, concurrent: ${concurrent}`));
	console.log();

	const times: number[] = [];
	let success = 0;
	let failed = 0;
	let completed = 0;

	const runRequest = async () => {
		const start = Date.now();
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 30000);
			await fetch(url, { signal: controller.signal });
			clearTimeout(timeoutId);
			times.push(Date.now() - start);
			success++;
		} catch {
			failed++;
		}
		completed++;
		if (completed % 10 === 0) {
			process.stdout.write(colors.dim(`${completed}/${count} `));
		}
	};

	const startTime = Date.now();
	const pending: Promise<void>[] = [];

	for (let i = 0; i < count; i++) {
		const p = runRequest();
		pending.push(p);
		if (pending.length >= concurrent) {
			await Promise.race(pending);
			pending.splice(
				pending.findIndex((p) => p),
				1,
			);
		}
	}

	await Promise.all(pending);
	const totalTime = Date.now() - startTime;

	const avg = times.length
		? times.reduce((a, b) => a + b, 0) / times.length
		: 0;
	const rps = (success / totalTime) * 1000;

	console.log(`\n\n${colors.bold("results:")}`);
	console.log(`  ${colors.green("success:")} ${success}/${count}`);
	console.log(`  ${colors.red("failed:")} ${failed}/${count}`);
	console.log(`  ${colors.magenta("rps:")} ${rps.toFixed(2)} req/s`);
	console.log(`  ${colors.dim("total:")} ${formatMs(totalTime)}`);
	console.log(`\n${colors.bold("latency:")}`);
	console.log(`  ${colors.dim("avg:")} ${formatMs(avg)}`);
	console.log(`  ${colors.dim("min:")} ${formatMs(Math.min(...times))}`);
	console.log(`  ${colors.dim("max:")} ${formatMs(Math.max(...times))}`);
	console.log(`  ${colors.cyan("p50:")} ${formatMs(percentile(times, 50))}`);
	console.log(`  ${colors.cyan("p95:")} ${formatMs(percentile(times, 95))}`);
	console.log(`  ${colors.cyan("p99:")} ${formatMs(percentile(times, 99))}`);
}

async function runScenario(
	name: string,
	opts: Record<string, string | number | boolean>,
) {
	const duration = (opts.duration as number) || 5000;

	console.log(colors.yellow(`\nrunning scenario: ${name}`));
	console.log(colors.dim(`duration: ${formatMs(duration)}`));
	console.log();

	cruel.scenario(name, {
		chaos: cruel.presets[name as keyof typeof cruel.presets] || { fail: 0.5 },
		duration,
	});

	await cruel.play(name);

	console.log(colors.green("\nscenario complete"));
	const stats = cruel.stats();
	console.log(colors.dim(`calls: ${stats.calls}`));
	console.log(colors.dim(`failures: ${stats.failures}`));
	console.log(colors.dim(`timeouts: ${stats.timeouts}`));
}

function showPresets() {
	logo();
	console.log(colors.bold("available presets:\n"));
	Object.entries(cruel.presets).forEach(([name, config]) => {
		console.log(`  ${colors.green(name)}`);
		const entries = Object.entries(config);
		entries.forEach(([k, v]) => {
			console.log(colors.dim(`    ${k}: ${JSON.stringify(v)}`));
		});
		console.log();
	});
}

function showStats() {
	const stats = cruel.stats();
	logo();
	console.log(colors.bold("chaos statistics:\n"));
	console.log(`  ${colors.dim("calls:")} ${stats.calls}`);
	console.log(`  ${colors.red("failures:")} ${stats.failures}`);
	console.log(`  ${colors.yellow("timeouts:")} ${stats.timeouts}`);
	console.log(`  ${colors.blue("delays:")} ${stats.delays}`);
	console.log(`  ${colors.dim("corrupted:")} ${stats.corrupted}`);
	console.log(`  ${colors.dim("rateLimited:")} ${stats.rateLimited}`);
	console.log(`  ${colors.dim("streamsCut:")} ${stats.streamsCut}`);
	console.log();
}

function showVersion() {
	console.log(`${colors.bold("cruel")} v1.0.1`);
}

async function main() {
	if (
		!command ||
		command === "help" ||
		command === "--help" ||
		command === "-h"
	) {
		help();
		return;
	}

	if (command === "version" || command === "--version" || command === "-v") {
		showVersion();
		return;
	}

	const opts = parseArgs(args.slice(1));

	switch (command) {
		case "test":
			if (!opts._target) {
				console.log(colors.red("error: url required"));
				console.log(colors.dim("usage: cruel test <url> [options]"));
				return;
			}
			await testEndpoint(opts._target as string, opts);
			break;

		case "benchmark":
			if (!opts._target) {
				console.log(colors.red("error: url required"));
				console.log(colors.dim("usage: cruel benchmark <url> [options]"));
				return;
			}
			await benchmark(opts._target as string, opts);
			break;

		case "scenario":
			if (!opts._target) {
				console.log(colors.red("error: scenario name required"));
				console.log(
					colors.dim(
						"available: networkPartition, highLatency, degraded, outage, recovery",
					),
				);
				return;
			}
			await runScenario(opts._target as string, opts);
			break;

		case "presets":
			showPresets();
			break;

		case "stats":
			showStats();
			break;

		default:
			console.log(colors.red(`unknown command: ${command}`));
			console.log(colors.dim("run 'cruel help' for usage"));
	}
}

main()
	.catch(console.error)
	.finally(() => process.exit(0));
