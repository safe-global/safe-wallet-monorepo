/**
 * Regression repro: `__webpack_modules__[moduleId] is not a function` in
 * `next dev` (rspack).
 *
 * Mechanism: module/chunk ids are positional in the dev server bundle. Each
 * on-demand route compile grows the module graph and can reassign ids, but
 * already-emitted lazy server chunks (next/dynamic components such as
 * NetworkSelector, TokenTransfer, CreateSafeOnNewChain) still call
 * __webpack_require__ with the old ids — which now point at non-function
 * registry slots. Visiting many routes in one session and then loading a page
 * that SSRs one of those lazy components reproduces the crash.
 *
 * This test spawns its own dev server (the failure is only visible in server
 * stdout), walks enough routes to force id reassignment, then loads the
 * trigger pages and asserts the error never appears.
 *
 * NOTE:
 * - Deliberately NOT importing the shared test fixture: this test needs to own
 *   the server process to read its output, and must not assume a running app.
 * - Wipes apps/web/.next for a deterministic cold graph. Do not run while a
 *   local dev server is using that directory.
 * - Run with: npx playwright test --config=e2e/playwright.config.ts dev-module-id-drift
 */
import { test, expect } from '@playwright/test'
import { spawn, type ChildProcess } from 'node:child_process'
import { rmSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = 4123
const BASE = `http://localhost:${PORT}`
const WEB_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
// Read-only static Safe on Sepolia (same one the smoke tests use)
const SAFE = 'sep:0x6E834E9D04ad6b26e1525dE1a37BFd9b215f40B7'

// Enough distinct routes to force many incremental compiles. The crash
// historically reproduced within ~13 route compiles.
const WARMUP_ROUTES = [
  `/home?safe=${SAFE}`,
  `/balances?safe=${SAFE}`,
  `/balances/nfts?safe=${SAFE}`,
  `/settings/setup?safe=${SAFE}`,
  `/settings/appearance?safe=${SAFE}`,
  `/settings/modules?safe=${SAFE}`,
  `/settings/security?safe=${SAFE}`,
  `/settings/notifications?safe=${SAFE}`,
  `/settings/safe-apps?safe=${SAFE}`,
  `/settings/data?safe=${SAFE}`,
  `/settings/environment-variables?safe=${SAFE}`,
  `/bridge?safe=${SAFE}`,
  `/stake?safe=${SAFE}`,
  `/swap?safe=${SAFE}`,
  `/apps?safe=${SAFE}`,
  `/address-book?safe=${SAFE}`,
  `/transactions/messages?safe=${SAFE}`,
  `/transactions/queue?safe=${SAFE}`,
]

// Pages whose SSR requires the lazy chunks that historically crashed
// (NetworkSelector / SafeCreationNetworkInput / TokenTransfer / NewTx).
const TRIGGER_ROUTES = [`/transactions/history?safe=${SAFE}`, '/new-safe/create', `/home?safe=${SAFE}`]

const CRASH_SIGNATURE = '__webpack_modules__[moduleId] is not a function'

// How many full warmup→edit→trigger cycles to run. Each cycle includes a real
// source edit (HMR rebuild) — the actual real-world trigger for the crash.
const CYCLES = Number(process.env.STRESS_CYCLES || 3)
// FAST mode: few routes, many edit cycles — maximises HMR churn (the real
// trigger) while minimising slow cold compiles, for quick config iteration.
const FAST = process.env.STRESS_FAST === '1'

// A shared component imported by (nearly) every route — editing it forces a
// broad HMR recompile, the strongest churn we can induce. Touched + reverted
// in-test; never left dirty.
const HMR_TARGET = path.join(WEB_DIR, 'src/components/common/PageLayout/index.tsx')

let server: ChildProcess
let serverOutput = ''
let serverExited = false
let serverExitInfo = ''

test.describe('dev server module-id stability', { tag: '@regression' }, () => {
  test.beforeAll(async () => {
    rmSync(path.join(WEB_DIR, '.next'), { recursive: true, force: true })

    // BUNDLER selects the dev bundler:
    //   rspack (default) — USE_RSPACK=1, the engine with the moduleId crash
    //   turbopack        — `next dev --turbopack` (different engine)
    //   webpack          — USE_RSPACK=0, no flag = Next's original webpack bundler
    // Turbopack is the default since Next 16 (and the bundler we now dev with).
    const bundler = process.env.BUNDLER || 'turbopack'
    const args = ['next', 'dev', '-p', String(PORT)]
    if (bundler === 'turbopack') args.push('--turbopack')
    server = spawn('npx', args, {
      cwd: WEB_DIR,
      // Polling ON (no NO_POLL) so the in-test source edits actually trigger
      // HMR rebuilds — the strongest chunk-graph churn and the real-world repro.
      env: { ...process.env, USE_RSPACK: bundler === 'rspack' ? '1' : '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    server.stdout?.on('data', (d: Buffer) => {
      serverOutput += d.toString()
    })
    server.stderr?.on('data', (d: Buffer) => {
      serverOutput += d.toString()
    })
    // The __webpack_modules__ crash throws as an unhandledRejection that takes
    // the dev server process down — so a process exit IS a reproduction signal.
    server.on('exit', (code, signal) => {
      serverExited = true
      serverExitInfo = `dev server exited (code=${code}, signal=${signal})`
    })

    // Wait for the dev server to accept connections
    await expect.poll(() => serverOutput.includes('Ready in'), { timeout: 120_000, intervals: [1000] }).toBe(true)
  })

  test.afterAll(() => {
    server?.kill('SIGTERM')
  })

  test('should not corrupt the server module registry across incremental route compiles', async ({ page }) => {
    // Generous budget: every route is a cold on-demand compile.
    test.setTimeout(900_000)

    // No login needed: the `__webpack_modules__` crash is a SERVER-SIDE compile
    // error that fires when the dev server compiles a route on the incoming
    // request — before any client-side auth-redirect guard runs. So even though
    // the browser is bounced to /welcome for gated routes, the server still
    // compiles each requested route, which is exactly what reproduces the
    // module-id drift. We just need to drive enough route compiles.

    // Visit a route and assert the dev server neither logged the crash nor
    // died from it. A navigation that fails *because the server is gone* is
    // itself the reproduction, so we attribute it to this route rather than
    // letting goto throw a raw ERR_CONNECTION_REFUSED.
    let visitCount = 0
    const visit = async (route: string, phase: string) => {
      const started = Date.now()
      const res = await page
        .goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 240_000 })
        .catch((e: Error) => e)
      const status =
        res && !(res instanceof Error) ? res.status() : `nav:${(res as Error)?.message?.split('\n')[0] ?? 'ok'}`
      // eslint-disable-next-line no-console
      console.log(`[visit ${++visitCount}] ${phase} ${route.split('?')[0]} → ${status} (${Date.now() - started}ms)`)

      // Client-side redirects abort the navigation (ERR_ABORTED) — benign.
      // The only failure signals we care about are: the dev server died, or
      // it logged the module-id crash. Nav-level errors are otherwise ignored.
      expect(serverExited, `${phase}: ${serverExitInfo} while loading ${route}`).toBe(false)
      expect(serverOutput, `${phase}: module-id crash while loading ${route}`).not.toContain(CRASH_SIGNATURE)
      if (res && !(res instanceof Error)) {
        expect(res.status(), `${phase}: 5xx on ${route}`).toBeLessThan(500)
      }
    }

    // Edit a shared source file to force an HMR rebuild, then restore it.
    // This is the real-world churn that triggers chunk-graph drift far more
    // aggressively than cold on-demand compiles alone.
    const original = readFileSync(HMR_TARGET, 'utf-8')
    let editN = 0
    const editAndRestore = async () => {
      writeFileSync(HMR_TARGET, `${original}\n// stress-edit ${++editN}\n`)
      await page.waitForTimeout(2_500) // let the HMR rebuild land
      writeFileSync(HMR_TARGET, original)
      await page.waitForTimeout(2_500)
      expect(serverExited, `dev server exited after HMR edit #${editN}`).toBe(false)
      expect(serverOutput, `module-id crash after HMR edit #${editN}`).not.toContain(CRASH_SIGNATURE)
    }

    // FAST: only the heavy tx-flow routes that crash, but many edit cycles.
    const warmup = FAST ? WARMUP_ROUTES.slice(0, 5) : WARMUP_ROUTES
    const triggers = FAST ? TRIGGER_ROUTES : [...TRIGGER_ROUTES, ...WARMUP_ROUTES.slice(0, 6)]
    const cycles = FAST ? Math.max(CYCLES, 5) : CYCLES

    try {
      for (let cycle = 1; cycle <= cycles; cycle++) {
        for (const route of warmup) {
          await visit(route, `c${cycle}-warmup`)
        }
        // HMR churn mid-cycle (the strongest trigger), then hammer the heavy
        // tx-flow / network-selector routes that historically blew up.
        await editAndRestore()
        for (const route of triggers) {
          await visit(route, `c${cycle}-trigger`)
        }
        await editAndRestore()
      }
    } finally {
      // Never leave the working tree dirty, even on failure.
      writeFileSync(HMR_TARGET, original)
    }
  })
})
