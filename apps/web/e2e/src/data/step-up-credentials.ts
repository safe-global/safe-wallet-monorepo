/**
 * Identities for the live step-up suite (`step-up-live.config.ts`), read from environment variables:
 *
 * - `STEP_UP_EMAIL` + `STEP_UP_TOTP_SECRET`: an email user with an enrolled authenticator (the secret is shown under
 *   "Trouble scanning?" when enrolling). Required.
 * - `STEP_UP_ADMIN_KEY`, `STEP_UP_MEMBER_KEY`: private keys of two wallets that sign in with Ethereum. Optional; the
 *   wallet tests skip without them.
 * - `STEP_UP_EMAIL_CODE_FILE`: for unattended runs, a file the emailed sign-in code is written to. Without it the
 *   login opens a browser and waits for the code to be typed in.
 * - `STEP_UP_SPACE_ID`: reuse an existing Workspace with a plan instead of creating one through onboarding.
 */

export type StepUpCredentials = {
  email: string
  totpSecret: string
  adminKey?: string
  memberKey?: string
  emailCodeFile?: string
  spaceId?: string
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PRIVATE_KEY = /^0x[0-9a-fA-F]{64}$/
const BASE32 = /^[A-Z2-7]+=*$/i
const EMAIL = /^[^\s@]+@[^\s@]+$/

type Env = Record<string, string | undefined>

function read(env: Env, name: string, pattern?: RegExp): string | undefined {
  const value = env[name]?.trim()
  if (!value) return undefined
  if (pattern && !pattern.test(value)) throw new Error(`${name} has an invalid format.`)
  return value
}

export function getStepUpCredentials(env: Env = process.env): StepUpCredentials {
  const email = read(env, 'STEP_UP_EMAIL', EMAIL)
  const totpSecret = read(env, 'STEP_UP_TOTP_SECRET', BASE32)
  if (!email || !totpSecret) throw new Error('Set STEP_UP_EMAIL and STEP_UP_TOTP_SECRET to run the step-up suite.')

  return {
    email,
    totpSecret,
    adminKey: read(env, 'STEP_UP_ADMIN_KEY', PRIVATE_KEY),
    memberKey: read(env, 'STEP_UP_MEMBER_KEY', PRIVATE_KEY),
    emailCodeFile: read(env, 'STEP_UP_EMAIL_CODE_FILE'),
    spaceId: read(env, 'STEP_UP_SPACE_ID', UUID),
  }
}

/** Seconds a second factor stays fresh on the target CGW (`AUTH_ELEVATION_WINDOW_SECONDS`, 60 on dev/staging). */
export function getElevationWindowSeconds(raw: string | undefined = process.env.STEP_UP_WINDOW_SECONDS): number {
  if (!raw) return 60
  const seconds = Number(raw)
  if (!Number.isInteger(seconds) || seconds <= 0) {
    throw new Error('STEP_UP_WINDOW_SECONDS must be a positive integer.')
  }
  return seconds
}
