/**
 * Helpers for the live step-up suite. CGW gates sensitive Workspace actions behind a second factor that is
 * at most `E2E_STEP_UP_WINDOW_SECONDS` old; the age comes from the `mfa_verified_at` claim of the session JWT.
 */
import type { BrowserContext, Page, Request, Response } from '@playwright/test'
import { CGW_BASE_URL } from '../data/constants'
import { getElevationWindowSeconds } from '../data/step-up-credentials'

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

/** Records every mutating CGW call and every step-up redirect the page makes from now on. */
export function recordStepUpTraffic(page: Page) {
  const calls: GatewayCall[] = []
  const elevateRequests: string[] = []

  const onResponse = (response: Response) => {
    const request = response.request()
    if (!response.url().startsWith(CGW_BASE_URL) || !MUTATING_METHODS.has(request.method())) return
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

export const uniqueLabel = (prefix: string) => `${prefix} ${Date.now().toString(36)}`
