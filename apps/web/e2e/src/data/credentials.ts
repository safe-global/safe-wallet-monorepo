/**
 * Wallet credentials parsing for Playwright E2E tests.
 *
 * Reuses the existing `CYPRESS_WALLET_CREDENTIALS` env var (same secret used by
 * the Cypress suite). It is a JSON string holding raw hex private keys and
 * addresses for the shared test owners.
 *
 * Rule: parsing is isolated here so it can be unit-tested by passing the raw
 * JSON via the `raw` param — tests never mutate process.env.
 */

export type WalletCredentials = {
  OWNER_1_PRIVATE_KEY: string
  OWNER_2_PRIVATE_KEY: string
  OWNER_4_PRIVATE_KEY: string
  OWNER_1_WALLET_ADDRESS: string
  OWNER_2_WALLET_ADDRESS: string
}

/**
 * Parse and validate the wallet credentials JSON.
 *
 * @param raw The raw JSON string. Defaults to `process.env.CYPRESS_WALLET_CREDENTIALS`.
 *            Pass explicitly in tests to avoid mutating process.env.
 * @throws if the var is empty, the JSON is malformed, or the default signer key is missing.
 */
export function getWalletCredentials(
  raw: string | undefined = process.env.CYPRESS_WALLET_CREDENTIALS,
): WalletCredentials {
  if (!raw || raw.trim() === '') {
    throw new Error(
      'CYPRESS_WALLET_CREDENTIALS env var is not set. ' +
        'Provide a JSON string with OWNER_*_PRIVATE_KEY / OWNER_*_WALLET_ADDRESS keys ' +
        '(the same secret used by the Cypress suite).',
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to parse CYPRESS_WALLET_CREDENTIALS as JSON: ${message}`)
  }

  const creds = parsed as Partial<WalletCredentials>

  if (!creds.OWNER_4_PRIVATE_KEY || creds.OWNER_4_PRIVATE_KEY.trim() === '') {
    throw new Error('CYPRESS_WALLET_CREDENTIALS is missing the required OWNER_4_PRIVATE_KEY field.')
  }

  return creds as WalletCredentials
}

/**
 * Returns the standard app signer private key (OWNER_4).
 *
 * @param creds Optional pre-parsed credentials. Parses from env if omitted.
 */
export function getDefaultSignerKey(creds: WalletCredentials = getWalletCredentials()): string {
  return creds.OWNER_4_PRIVATE_KEY
}
