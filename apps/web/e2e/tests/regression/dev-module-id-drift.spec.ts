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
import { rmSync } from 'node:fs'
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

let server: ChildProcess
let serverOutput = ''
let serverExited = false
let serverExitInfo = ''

test.describe('dev server module-id stability', { tag: '@regression' }, () => {
  test.beforeAll(async () => {
    rmSync(path.join(WEB_DIR, '.next'), { recursive: true, force: true })

    server = spawn('npx', ['next', 'dev', '-p', String(PORT)], {
      cwd: WEB_DIR,
      env: { ...process.env, USE_RSPACK: '1', NO_POLL: '1' },
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

    for (const route of WARMUP_ROUTES) {
      await visit(route, 'warmup')
      // Give on-demand entries time to settle; the real-world repro involves
      // idle-eviction (~25s) and recompile cycles, not just cold compiles.
      await page.waitForTimeout(2_000)
    }

    // Second pass: revisit early routes after they may have been evicted —
    // eviction + recompile is where ids get reassigned under the old graph.
    for (const route of WARMUP_ROUTES.slice(0, 8)) {
      await visit(route, 'revisit')
    }

    for (const route of TRIGGER_ROUTES) {
      await visit(route, 'trigger')
    }
  })
})
