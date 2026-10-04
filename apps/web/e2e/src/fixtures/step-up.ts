/**
 * Helpers for the live step-up suite. CGW gates sensitive Workspace actions behind a second factor that is
 * at most `STEP_UP_WINDOW_SECONDS` old; the age comes from the `mfa_verified_at` claim of the session JWT.
 */
import fs from 'node:fs'
import path from 'node:path'
import type { BrowserContext, BrowserContextOptions, Page, Request, Response } from '@playwright/test'
import { CGW_BASE_URL } from '../data/constants'
import { getElevationWindowSeconds } from '../data/step-up-credentials'
import { RUN_STATE } from '../data/step-up-paths'

const ACCESS_TOKEN_COOKIE = 'access_token'
const SAFETY_MARGIN_SECONDS = 3
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export const ELEVATE_REQUEST = /\/v1\/auth\/oidc\/authorize\?.*elevate=true/

async function readSessionClaims(context: BrowserContext): Promise<Record<string, unknown>> {
  const cookie = (await context.cookies(CGW_BASE_URL)).find((c) => c.name === ACCESS_TOKEN_COOKIE)
  if (!cookie) throw new Error(`No ${ACCESS_TOKEN_COOKIE} cookie for ${CGW_BASE_URL}; is the session signed in?`)
  const payload = cookie.value.split('.')[1]
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>
}

/** Seconds until the current second factor stops counting as fresh (0 when it already lapsed). */
export async function secondsUntilWindowLapses(context: BrowserContext): Promise<number> {
  const claims = await readSessionClaims(context)
  const verifiedAt = typeof claims.mfa_verified_at === 'number' ? claims.mfa_verified_at : 0
  const lapsesAt = verifiedAt + getElevationWindowSeconds() + SAFETY_MARGIN_SECONDS
  return Math.max(0, lapsesAt - Math.floor(Date.now() / 1000))
}

/** The gate is time-based, so the only faithful way to reach "needs a fresh factor" is to let the clock run. */
export async function waitForWindowToLapse(page: Page): Promise<void> {
  const seconds = await secondsUntilWindowLapses(page.context())
  if (seconds > 0) await page.waitForTimeout(seconds * 1000)
}

export type GatewayCall = { method: string; path: string; status: number }

/** Records every mutating CGW call, the billing redirects (checkout, portal) and every step-up redirect the page makes from now on. */
export function recordStepUpTraffic(page: Page) {
  const calls: GatewayCall[] = []
  const elevateRequests: string[] = []

  const onResponse = (response: Response) => {
    const request = response.request()
    const isGatedRead =
      request.method() === 'GET' && /\/v1\/billing\/.*\/(checkout-url|session-url)/.test(response.url())
    if (!response.url().startsWith(CGW_BASE_URL) || !(MUTATING_METHODS.has(request.method()) || isGatedRead)) return
    calls.push({ method: request.method(), path: new URL(response.url()).pathname, status: response.status() })
  }
  const onRequest = (request: Request) => {
    if (ELEVATE_REQUEST.test(request.url())) elevateRequests.push(request.url())
  }

  page.on('response', onResponse)
  page.on('request', onRequest)

  return {
    calls,
    elevateRequests,
    callsTo: (method: string, path: RegExp) => calls.filter((c) => c.method === method && path.test(c.path)),
    stop: () => {
      page.off('response', onResponse)
      page.off('request', onRequest)
    },
  }
}

type StorageState = Exclude<BrowserContextOptions['storageState'], string | undefined>

const SESSION_MARGIN_SECONDS = 30 * 60

/** True while the saved CGW cookie and the Auth0 session both outlive the margin, so no new sign-in is needed. */
export function isSessionAlive(state: StorageState, nowSeconds = Date.now() / 1000): boolean {
  const alive = (match: (c: StorageState['cookies'][number]) => boolean) =>
    state.cookies.some((c) => match(c) && c.expires > nowSeconds + SESSION_MARGIN_SECONDS)
  return (
    alive((c) => c.name === ACCESS_TOKEN_COOKIE && CGW_BASE_URL.includes(c.domain.replace(/^\./, ''))) &&
    alive((c) => c.name === 'auth0' && c.domain.endsWith('auth0.com'))
  )
}

export type RunState = { spaceId: string; spaceName: string }

export function readRunState(): RunState | undefined {
  if (!fs.existsSync(RUN_STATE)) return undefined
  return JSON.parse(fs.readFileSync(RUN_STATE, 'utf8')) as RunState
}

export function writeRunState(state: RunState): void {
  fs.mkdirSync(path.dirname(RUN_STATE), { recursive: true })
  fs.writeFileSync(RUN_STATE, JSON.stringify(state, null, 2))
}

export const uniqueLabel = (prefix: string) => `${prefix} ${Date.now().toString(36)}`
