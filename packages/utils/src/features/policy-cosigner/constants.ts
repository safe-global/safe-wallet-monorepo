/**
 * Shared web+mobile: every value reads `NEXT_PUBLIC_*` first and falls back to `EXPO_PUBLIC_*`.
 * Reads must stay static (`process.env.NEXT_PUBLIC_…`) or the bundlers can't inline them.
 */

const parseCsv = (value: string | undefined): string[] =>
  value
    ? value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    : []

export const COSIGNER_SERVICE_URL = (
  process.env.NEXT_PUBLIC_COSIGNER_SERVICE_URL ||
  process.env.EXPO_PUBLIC_COSIGNER_SERVICE_URL ||
  ''
).replace(/\/$/, '')

export const COSIGNER_CHAIN_IDS: readonly string[] = parseCsv(
  process.env.NEXT_PUBLIC_COSIGNER_CHAIN_IDS || process.env.EXPO_PUBLIC_COSIGNER_CHAIN_IDS,
)

/**
 * The co-signer service for `chainId`: a URL saved in the app's settings wins, otherwise the env URL
 * on the chains the env lists. No URL means co-signing is off on that chain.
 */
export const resolveCosignerServiceUrl = (
  chainId: string | undefined,
  overrides: Readonly<Record<string, string>> = {},
  envUrl: string = COSIGNER_SERVICE_URL,
  envChainIds: readonly string[] = COSIGNER_CHAIN_IDS,
): string | undefined => {
  if (!chainId) return undefined
  const override = overrides[chainId]?.trim().replace(/\/$/, '')
  if (override) return override
  return envUrl && envChainIds.includes(chainId) ? envUrl : undefined
}

// keccak256("SafePolicyGuard.PolicyContext.v1") — SafePolicyGuard._CONTEXT_TYPE_HASH
export const POLICY_CONTEXT_TYPE_HASH = '0x5aa463b48748f9162d63ae93151d31fed6a96b34cd2ae84ef33d25b0bdea62e4'

export const ERC1271_MAGIC_VALUE = '0x1626ba7e'

export const POLICY_GUARD_GET_POLICY_ABI = [
  'function getPolicy(address safe, address to, bytes data, uint8 operation) view returns (uint256 access, address policy)',
]

export const COSIGNER_POLICY_ABI = [
  'function getCoSigner(address policyGuard, address safe, uint256 access) view returns (address cosigner)',
]

export const ERC1271_ABI = ['function isValidSignature(bytes32 hash, bytes signature) view returns (bytes4)']
