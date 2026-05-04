import { SafeProvider, getP256VerifierAddress, getSafeWebAuthnSignerFactoryContract } from '@safe-global/protocol-kit'
import type { SafeVersion } from '@safe-global/types-kit'
import { LATEST_SAFE_VERSION } from '@safe-global/utils/config/constants'
import type { PasskeyArgType, PasskeyCoordinates, PasskeyGetFn, PasskeyMetadata } from './types'
import { UnsupportedChainError } from './types'

/**
 * Resolves the DaimoP256Verifier address for a chain. Wraps protocol-kit's
 * `getP256VerifierAddress` (which throws on unsupported chains) into a typed
 * `UnsupportedChainError` so callers can distinguish it from generic failures.
 */
export function resolveVerifierAddress(chainId: string): string {
  try {
    return getP256VerifierAddress(chainId)
  } catch (cause) {
    throw new UnsupportedChainError(chainId, cause)
  }
}

/**
 * Builds the protocol-kit `PasskeyArgType` for a stored passkey on a given
 * chain. The `getFn` is platform-injected (browser uses `navigator.credentials.get`,
 * mobile uses `react-native-passkeys`).
 */
export function buildPasskeyArg(args: {
  passkey: Pick<PasskeyMetadata, 'rawId' | 'coordinates'>
  chainId: string
  getFn?: PasskeyGetFn
}): PasskeyArgType {
  const verifierAddress = resolveVerifierAddress(args.chainId)
  return {
    rawId: args.passkey.rawId,
    coordinates: args.passkey.coordinates,
    verifierAddress,
    ...(args.getFn ? { getFn: args.getFn } : {}),
  }
}

/**
 * Derives the counterfactual `SafeWebAuthnSignerProxy` address for a passkey
 * on a given chain. Calls the factory's `getSigner(x, y, verifier)` view —
 * no Safe instance needed, no on-chain deployment required.
 */
export async function deriveIdentityAddress(args: {
  rpcUrl: string
  chainId: string
  coordinates: PasskeyCoordinates
  safeVersion?: SafeVersion
}): Promise<string> {
  const verifierAddress = resolveVerifierAddress(args.chainId)
  const safeProvider = new SafeProvider({ provider: args.rpcUrl })
  const safeVersion = args.safeVersion ?? (LATEST_SAFE_VERSION as SafeVersion)

  const factory = await getSafeWebAuthnSignerFactoryContract({ safeProvider, safeVersion })
  const [signer] = await factory.getSigner([
    BigInt(args.coordinates.x),
    BigInt(args.coordinates.y),
    BigInt(verifierAddress),
  ])
  return signer
}

/**
 * Returns true if the `SafeWebAuthnSignerProxy` at `address` has been deployed
 * on the chain (i.e. `eth_getCode` returns non-empty bytecode).
 */
export async function isIdentityDeployed(args: { rpcUrl: string; address: string }): Promise<boolean> {
  const safeProvider = new SafeProvider({ provider: args.rpcUrl })
  return safeProvider.isContractDeployed(args.address)
}

/**
 * Returns the proxy address for a passkey on `chainId`, deriving and caching
 * back into the metadata's `identityContractAddresses` map on first call.
 * Pure read-side helper — does not persist; the caller decides whether to
 * write the updated map back to storage.
 */
export async function resolveIdentityForChain(args: {
  rpcUrl: string
  chainId: string
  passkey: Pick<PasskeyMetadata, 'coordinates' | 'identityContractAddresses'>
}): Promise<string> {
  const cached = args.passkey.identityContractAddresses[args.chainId]
  if (cached) return cached
  return deriveIdentityAddress({
    rpcUrl: args.rpcUrl,
    chainId: args.chainId,
    coordinates: args.passkey.coordinates,
  })
}
