#!/usr/bin/env node
// Runs the built site in the local Pages runtime on a throwaway D1 and takes
// phone-sized screenshots. Usage: see .agents/skills/verify-juoksut/SKILL.md.
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { chromium, devices } from 'playwright'

const args = process.argv.slice(2)
const flag = name => args.includes(name)
function option(name) {
  const i = args.indexOf(name)
  return i === -1 ? null : args[i + 1]
}
const flow = option('--flow')
const routes = args.filter((arg, i) => arg.startsWith('/') && args[i - 1] !== '--flow')
if (!routes.length && !flow)
  routes.push('/', '/shop')

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const out = resolve('.verify', stamp)
const state = resolve(out, 'state')
mkdirSync(state, { recursive: true })

const wrangler = resolve('node_modules/.bin/wrangler')
function run(cmd, cmdArgs) {
  const result = spawnSync(cmd, cmdArgs, { stdio: 'inherit' })
  if (result.status !== 0)
    throw new Error(`${cmd} ${cmdArgs.join(' ')} failed`)
}

if (!flag('--no-build'))
  run('corepack', ['yarn', 'build'])

for (const file of ['d1/schema.sql', 'd1/seed.sql', 'scripts/verify-fixtures.sql']) {
  if (existsSync(file))
    run(wrangler, ['d1', 'execute', 'juoksut-products', '--local', '--persist-to', state, '--file', file])
}

const port = await new Promise((done) => {
  const server = createServer().listen(0, () => {
    const { port } = server.address()
    server.close(() => done(port))
  })
})
const base = `http://127.0.0.1:${port}`
const server = spawn(wrangler, ['pages', 'dev', 'dist', '--port', String(port), '--ip', '127.0.0.1', '--persist-to', state], {
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: true,
})
const serverLog = []
server.stdout.on('data', chunk => serverLog.push(String(chunk)))
server.stderr.on('data', chunk => serverLog.push(String(chunk)))
function stop() {
  try {
    process.kill(-server.pid)
  }
  catch {}
}
process.on('exit', stop)

const manifest = { base, shots: [], consoleErrors: [], ok: false }
try {
  for (let i = 0; ; i++) {
    if (i > 60)
      throw new Error('server did not answer within 60 s')
    const ok = await fetch(base).then(r => r.ok).catch(() => false)
    if (ok)
      break
    await new Promise(r => setTimeout(r, 1000))
  }

  const browser = await chromium.launch()
  const context = await browser.newContext({ ...devices['iPhone 13'] })
  const page = await context.newPage()
  page.on('console', (msg) => {
    if (msg.type() === 'error')
      manifest.consoleErrors.push(`${page.url()}: ${msg.text()}`)
  })
  const shot = async (name) => {
    const path = resolve(out, `${name}.png`)
    await page.screenshot({ path, fullPage: true })
    manifest.shots.push({ name, url: page.url(), path })
  }

  for (const route of routes) {
    await page.goto(base + route, { waitUntil: 'networkidle' })
    // The site's LoadingScreen fades out after load.
    await page.waitForTimeout(1500)
    await shot(route === '/' ? 'home' : route.slice(1).replace(/\//g, '_'))
  }

  if (flow) {
    const { default: drive } = await import(pathToFileURL(resolve(flow)).href)
    await drive({ page, base, shot, d1: sql => spawnSync(wrangler, ['d1', 'execute', 'juoksut-products', '--local', '--persist-to', state, '--json', '--command', sql], { encoding: 'utf8' }).stdout })
  }

  await browser.close()
  manifest.ok = true
}
finally {
  stop()
  writeFileSync(resolve(out, 'server.log'), serverLog.join(''))
  writeFileSync(resolve(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`evidence: ${out}`)
}
process.exit(manifest.ok ? 0 : 1)
