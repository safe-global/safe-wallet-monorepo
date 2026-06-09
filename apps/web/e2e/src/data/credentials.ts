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
  OWNER_4_PRIVATE_KEY: string
  OWNER_1_PRIVATE_KEY?: string
  OWNER_2_PRIVATE_KEY?: string
  OWNER_1_WALLET_ADDRESS?: string
  OWNER_2_WALLET_ADDRESS?: string
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

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('CYPRESS_WALLET_CREDENTIALS must be a JSON object.')
  }

  const record = parsed as Record<string, unknown>

  const knownFields: (keyof WalletCredentials)[] = [
    'OWNER_4_PRIVATE_KEY',
    'OWNER_1_PRIVATE_KEY',
    'OWNER_2_PRIVATE_KEY',
    'OWNER_1_WALLET_ADDRESS',
    'OWNER_2_WALLET_ADDRESS',
  ]

  for (const field of knownFields) {
    const value = record[field]
    if (value !== undefined && typeof value !== 'string') {
      throw new Error(`CYPRESS_WALLET_CREDENTIALS field ${field} must be a string.`)
    }
  }

  const signerKey = record.OWNER_4_PRIVATE_KEY
  if (typeof signerKey !== 'string' || signerKey.trim() === '') {
    throw new Error('CYPRESS_WALLET_CREDENTIALS is missing the required OWNER_4_PRIVATE_KEY field.')
  }

  return record as WalletCredentials
}

/**
 * Returns the standard app signer private key (OWNER_4).
 *
 * @param creds Optional pre-parsed credentials. Parses from env if omitted.
 */
export function getDefaultSignerKey(creds: WalletCredentials = getWalletCredentials()): string {
  return creds.OWNER_4_PRIVATE_KEY
}
