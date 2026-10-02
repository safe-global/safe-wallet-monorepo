/**
 * Credentials for the live step-up suite (`tests/regression/step-up-live.spec.ts`), read from
 * `E2E_STEP_UP_CREDENTIALS`. Both identities are optional; tests that need a missing one skip.
 *
 * {
 *   "oidc": { "storageState": "<base64 Playwright storage state>", "totpSecret": "<base32>", "spaceId": "<uuid>" },
 *   "siwe": { "privateKey": "0x…", "spaceId": "<uuid>" }
 * }
 *
 * The OIDC storage state must hold a live Auth0 session (cookies on the Auth0 tenant domain) as well as
 * the CGW `access_token` cookie: sign-in needs an emailed code, so the suite starts from a saved session.
 */
import type { BrowserContextOptions } from '@playwright/test'

type StorageState = Exclude<BrowserContextOptions['storageState'], string | undefined>

export type OidcStepUpCredentials = {
  storageState: StorageState
  totpSecret: string
  spaceId: string
}

export type SiweStepUpCredentials = {
  privateKey: string
  spaceId: string
}

export type StepUpCredentials = {
  oidc?: OidcStepUpCredentials
  siwe?: SiweStepUpCredentials
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PRIVATE_KEY = /^0x[0-9a-fA-F]{64}$/
const BASE32 = /^[A-Z2-7]+=*$/i

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

function requireString(record: Record<string, unknown>, path: string, field: string, pattern?: RegExp): string {
  const value = record[field]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`E2E_STEP_UP_CREDENTIALS: ${path}.${field} must be a non-empty string.`)
  }
  if (pattern && !pattern.test(value.trim())) {
    throw new Error(`E2E_STEP_UP_CREDENTIALS: ${path}.${field} has an invalid format.`)
  }
  return value.trim()
}

function parseStorageState(encoded: string): StorageState {
  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'))
  } catch {
    throw new Error('E2E_STEP_UP_CREDENTIALS: oidc.storageState must be base64-encoded JSON.')
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.cookies) || !Array.isArray(parsed.origins)) {
    throw new Error('E2E_STEP_UP_CREDENTIALS: oidc.storageState must be a Playwright storage state.')
  }
  return parsed as StorageState
}

export function getStepUpCredentials(raw: string | undefined = process.env.E2E_STEP_UP_CREDENTIALS): StepUpCredentials {
  if (!raw || raw.trim() === '') return {}

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to parse E2E_STEP_UP_CREDENTIALS as JSON: ${message}`)
  }
  if (!isRecord(parsed)) throw new Error('E2E_STEP_UP_CREDENTIALS must be a JSON object.')

  const credentials: StepUpCredentials = {}

  if (parsed.oidc !== undefined) {
    if (!isRecord(parsed.oidc)) throw new Error('E2E_STEP_UP_CREDENTIALS: oidc must be an object.')
    credentials.oidc = {
      storageState: parseStorageState(requireString(parsed.oidc, 'oidc', 'storageState')),
      totpSecret: requireString(parsed.oidc, 'oidc', 'totpSecret', BASE32),
      spaceId: requireString(parsed.oidc, 'oidc', 'spaceId', UUID),
    }
  }

  if (parsed.siwe !== undefined) {
    if (!isRecord(parsed.siwe)) throw new Error('E2E_STEP_UP_CREDENTIALS: siwe must be an object.')
    credentials.siwe = {
      privateKey: requireString(parsed.siwe, 'siwe', 'privateKey', PRIVATE_KEY),
      spaceId: requireString(parsed.siwe, 'siwe', 'spaceId', UUID),
    }
  }

  return credentials
}

/** Seconds a second factor stays fresh on the target CGW (`AUTH_ELEVATION_WINDOW_SECONDS`, 60 on dev/staging). */
export function getElevationWindowSeconds(raw: string | undefined = process.env.E2E_STEP_UP_WINDOW_SECONDS): number {
  if (!raw) return 60
  const seconds = Number(raw)
  if (!Number.isInteger(seconds) || seconds <= 0) {
    throw new Error('E2E_STEP_UP_WINDOW_SECONDS must be a positive integer.')
  }
  return seconds
}
