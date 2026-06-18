/**
 * Tokens that are intentionally hidden from balances across the app (assets list,
 * dashboard, totals and the send-tokens flow).
 *
 * Monerium upgraded its e-money tokens to v2 (https://docs.monerium.com/contracts-v2/).
 * We hide the v1 EURe contracts so users are steered towards the v2 tokens.
 *
 * Addresses are matched case-insensitively, so casing here is irrelevant.
 * Add further v1 contracts (other chains / GBPe / USDe / ISKe) here as they become known.
 */
export const DEPRECATED_TOKEN_ADDRESSES: string[] = [
  '0x3231Cb76718CDeF2155FC47b5286d82e6eDA273f', // Monerium EURe v1 (Ethereum)
  '0xcB444e90D8198415266c6a2724b7900fb12FC56E', // Monerium EURe v1 (Gnosis)
  '0x18ec0A6E18E5bc3784fDd3a3634b31245ab704F6', // Monerium EURe v1 (Polygon)
]

const deprecatedTokenSet = new Set(DEPRECATED_TOKEN_ADDRESSES.map((address) => address.toLowerCase()))

export const isDeprecatedToken = (address: string): boolean => deprecatedTokenSet.has(address.toLowerCase())
