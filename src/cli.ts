#!/usr/bin/env node

import { cruel } from "./index.js"

const args = process.argv.slice(2)
const command = args[0]

const colors = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
}

function logo() {
  console.log(`
${colors.red("  ▄████▄  ██▀███  █    ██ ▓█████  ██▓    ")}
${colors.red(" ▒██▀ ▀█ ▓██ ▒ ██▒██  ▓██▒▓█   ▀ ▓██▒    ")}
${colors.red(" ▒▓█    ▄▓██ ░▄█ ▓██  ▒██░▒███   ▒██░    ")}
${colors.red(" ▒▓▓▄ ▄██▒██▀▀█▄ ▓▓█  ░██░▒▓█  ▄ ▒██░    ")}
${colors.red(" ▒ ▓███▀ ░██▓ ▒██▒▒█████▓ ░▒████▒░██████▒")}
${colors.red(" ░ ░▒ ▒  ░ ▒▓ ░▒▓░▒▓▒ ▒ ▒ ░░ ▒░ ░░ ▒░▓  ░")}
${colors.dim("   chaos testing with zero mercy")}
`)
}

function help() {
  logo()
  console.log(`
${colors.bold("usage:")} cruel <command> [options]

${colors.bold("commands:")}
  ${colors.green("test")} <url>        test endpoint with chaos
  ${colors.green("intercept")} <url>   intercept and inject chaos
  ${colors.green("scenario")} <name>   run predefined scenario
  ${colors.green("stats")}             show chaos statistics
  ${colors.green("presets")}           list available presets

${colors.bold("options:")}
  --fail <rate>      failure rate (0-1)
  --delay <ms>       delay in ms or min-max
  --timeout <rate>   timeout rate (0-1)
  --duration <ms>    how long to run
  --preset <name>    use a preset config
  --count <n>        number of requests

${colors.bold("examples:")}
  cruel test https://api.example.com --fail 0.1
  cruel test https://api.example.com --preset nightmare
  cruel scenario outage --duration 5000
  cruel intercept api.openai.com --rateLimit 0.2

${colors.bold("presets:")}
  development, staging, production, harsh, nightmare, apocalypse

${colors.bold("scenarios:")}
  networkPartition, highLatency, degraded, outage, recovery
`)
}

function parseArgs(args: string[]): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {}
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith("--")) {
      const key = arg.slice(2)
      const next = args[i + 1]
      if (next && !next.startsWith("--")) {
        const num = parseFloat(next)
        result[key] = isNaN(num) ? next : num
        i++
      } else {
        result[key] = true
      }
    } else if (!result._target) {
      result._target = arg
    }
  }
  return result
}

async function testEndpoint(url: string, opts: Record<string, string | number | boolean>) {
  const count = (opts.count as number) || 10
  const preset = opts.preset as string

  let chaosOpts = {}
  if (preset && preset in cruel.presets) {
    chaosOpts = cruel.presets[preset as keyof typeof cruel.presets]
  } else {
    chaosOpts = {
      fail: opts.fail as number,
      delay: opts.delay as number,
      timeout: opts.timeout as number,
    }
  }

  console.log(colors.yellow(`\ntesting ${url} with ${count} requests\n`))
  console.log(colors.dim(`config: ${JSON.stringify(chaosOpts)}\n`))

  const cruelFetch = cruel(fetch, chaosOpts)

  let success = 0
  let failed = 0
  let timeouts = 0
  const times: number[] = []

  for (let i = 0; i < count; i++) {
    const start = Date.now()
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      await cruelFetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      const time = Date.now() - start
      times.push(time)
      success++
      process.stdout.write(colors.green("."))
    } catch (e) {
      const err = e as Error
      if (err.name === "AbortError" || err.message.includes("timeout")) {
        timeouts++
        process.stdout.write(colors.yellow("T"))
      } else {
        failed++
        process.stdout.write(colors.red("X"))
      }
    }
  }

  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0
  const min = times.length ? Math.min(...times) : 0
  const max = times.length ? Math.max(...times) : 0

  console.log(`\n\n${colors.bold("results:")}`)
  console.log(`  ${colors.green("success:")} ${success}/${count} (${Math.round(success/count*100)}%)`)
  console.log(`  ${colors.red("failed:")} ${failed}/${count} (${Math.round(failed/count*100)}%)`)
  console.log(`  ${colors.yellow("timeouts:")} ${timeouts}/${count} (${Math.round(timeouts/count*100)}%)`)
  console.log(`\n${colors.bold("latency:")}`)
  console.log(`  ${colors.dim("avg:")} ${avg}ms`)
  console.log(`  ${colors.dim("min:")} ${min}ms`)
  console.log(`  ${colors.dim("max:")} ${max}ms`)
}

async function runScenario(name: string, opts: Record<string, string | number | boolean>) {
  const duration = (opts.duration as number) || 5000

  console.log(colors.yellow(`\nrunning scenario: ${name}`))
  console.log(colors.dim(`duration: ${duration}ms\n`))

  cruel.scenario(name, {
    chaos: cruel.presets[name as keyof typeof cruel.presets] || { fail: 0.5 },
    duration
  })

  await cruel.play(name)

  console.log(colors.green("\nscenario complete"))
  console.log(colors.dim(JSON.stringify(cruel.stats(), null, 2)))
}

function showPresets() {
  console.log(colors.bold("\navailable presets:\n"))
  Object.entries(cruel.presets).forEach(([name, config]) => {
    console.log(`  ${colors.green(name)}`)
    console.log(colors.dim(`    ${JSON.stringify(config)}`))
  })
  console.log()
}

function showStats() {
  const stats = cruel.stats()
  console.log(colors.bold("\nchaos statistics:\n"))
  console.log(`  ${colors.dim("calls:")} ${stats.calls}`)
  console.log(`  ${colors.red("failures:")} ${stats.failures}`)
  console.log(`  ${colors.yellow("timeouts:")} ${stats.timeouts}`)
  console.log(`  ${colors.blue("delays:")} ${stats.delays}`)
  console.log(`  ${colors.dim("corrupted:")} ${stats.corrupted}`)
  console.log(`  ${colors.dim("rateLimited:")} ${stats.rateLimited}`)
  console.log(`  ${colors.dim("streamsCut:")} ${stats.streamsCut}`)
  console.log()
}

async function main() {
  if (!command || command === "help" || command === "--help" || command === "-h") {
    help()
    return
  }

  const opts = parseArgs(args.slice(1))

  switch (command) {
    case "test":
      if (!opts._target) {
        console.log(colors.red("error: url required"))
        return
      }
      await testEndpoint(opts._target as string, opts)
      break

    case "scenario":
      if (!opts._target) {
        console.log(colors.red("error: scenario name required"))
        return
      }
      await runScenario(opts._target as string, opts)
      break

    case "presets":
      showPresets()
      break

    case "stats":
      showStats()
      break

    default:
      console.log(colors.red(`unknown command: ${command}`))
      help()
  }
}

main().catch(console.error)
