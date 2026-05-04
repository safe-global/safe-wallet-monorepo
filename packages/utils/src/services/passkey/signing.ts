import Safe from '@safe-global/protocol-kit'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { PasskeyGetFn, PasskeyMetadata, PasskeyStorage, RelayClient } from './types'
import { buildPasskeyArg, isIdentityDeployed, resolveIdentityForChain } from './identity'
import { awaitDeployment, deployIdentity } from './deployment'

export interface SignSafeTxWithPasskeyArgs {
  rpcUrl: string
  chainId: string
  safeAddress: string
  safeTx: SafeTransaction
  passkey: PasskeyMetadata
  getFn: PasskeyGetFn
  relay: RelayClient
  storage: PasskeyStorage
  cgwBaseUrl: string
}

export interface SignSafeTxWithPasskeyResult {
  signedTx: SafeTransaction
  safeTransactionHash: string
  deployment?: { taskId: string; transactionHash: string }
}

/**
 * Signs a Safe transaction with a passkey and ensures the
 * `SafeWebAuthnSignerProxy` is deployed on-chain before returning.
 *
 * Ordering is intentional: sign first (the biometric prompt is the
 * user-facing latency we want resolved immediately), then check the
 * deployment cache, then deploy via relay only if needed. Subsequent
 * signatures on the same chain are cached and skip the relay round-trip.
 *
 * On-chain deployment is required for Safe's `checkSignatures` to verify
 * the ERC-1271 signature during execution.
 */
export async function signSafeTxWithPasskey(args: SignSafeTxWithPasskeyArgs): Promise<SignSafeTxWithPasskeyResult> {
  const passkeyArg = buildPasskeyArg({
    passkey: args.passkey,
    chainId: args.chainId,
    getFn: args.getFn,
  })

  const protocolKit = await Safe.init({
    provider: args.rpcUrl,
    signer: passkeyArg,
    safeAddress: args.safeAddress,
  })

  const signedTx = await protocolKit.signTransaction(args.safeTx)
  const safeTransactionHash = await protocolKit.getTransactionHash(signedTx)

  const deployment = await ensureDeployed(args)
  return deployment ? { signedTx, safeTransactionHash, deployment } : { signedTx, safeTransactionHash }
}

async function ensureDeployed(
  args: SignSafeTxWithPasskeyArgs,
): Promise<{ taskId: string; transactionHash: string } | undefined> {
  // Resolve the proxy address for THIS chain. The verifier address (and thus
  // the CREATE2 result) differs per chain, so we cannot trust an address
  // derived elsewhere — we look up the per-chain map or derive fresh.
  const identityAddress = await resolveIdentityForChain({
    rpcUrl: args.rpcUrl,
    chainId: args.chainId,
    passkey: args.passkey,
  })
  // Cache the derivation so subsequent lookups skip the factory view call.
  if (!args.passkey.identityContractAddresses[args.chainId]) {
    await args.storage.setIdentityForChain(args.passkey.rawId, args.chainId, identityAddress)
  }

  if (args.passkey.deployedOnChains.includes(args.chainId)) {
    return undefined
  }

  const alreadyDeployed = await isIdentityDeployed({ rpcUrl: args.rpcUrl, address: identityAddress })
  if (alreadyDeployed) {
    await args.storage.markDeployedOnChain(args.passkey.rawId, args.chainId)
    return undefined
  }

  const { taskId } = await deployIdentity({
    rpcUrl: args.rpcUrl,
    chainId: args.chainId,
    coordinates: args.passkey.coordinates,
    relay: args.relay,
  })

  const { transactionHash } = await awaitDeployment({
    cgwBaseUrl: args.cgwBaseUrl,
    chainId: args.chainId,
    taskId,
  })

  await args.storage.markDeployedOnChain(args.passkey.rawId, args.chainId)
  return { taskId, transactionHash }
}
