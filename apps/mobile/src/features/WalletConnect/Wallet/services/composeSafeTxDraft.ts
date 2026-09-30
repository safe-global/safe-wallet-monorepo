import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { MetaTransactionData } from '@safe-global/types-kit'
import { Interface } from 'ethers'
import { getVerifiedSafeSDK, previewAndStashDraft } from '@/src/services/tx/draft'
import { getCreateCallContractDeployment } from '@safe-global/utils/services/contracts/deployments'
import type { AppDispatch } from '@/src/store'

// dApp call shape per EIP-5792 / WC. Contract deployments omit `to` and provide `data` only.
export type DappCall = {
  to?: string
  value?: string // hex or decimal string
  data?: string
}

export type ComposeSafeTxDraftInput = {
  calls: DappCall[] // single for eth_sendTransaction, batch for wallet_sendCalls
  chainId: string
  safeAddress: string
  safe: SafeState
  chain: Chain
  dispatch: AppDispatch
}

// dApps send value as hex, but protocol-kit/ethers want decimal (else a misleading
// "invalid base-10 numeric string" deep in the sign path). BigInt accepts both; toString emits decimal.
const normalizeValue = (value: string | undefined): string => {
  if (!value) {
    return '0'
  }
  return BigInt(value).toString()
}

// Contract deployment (no-to + data-only) routed through CreateCall, mirroring web.
const buildCreateCallTx = (chain: Chain, safeVersion: SafeState['version'], data: string): MetaTransactionData => {
  const deployment = getCreateCallContractDeployment(chain, safeVersion)
  if (!deployment) {
    throw new Error('No CreateCall deployment found for chain and safe version')
  }
  const addressOrAddresses = deployment.networkAddresses[chain.chainId]
  const createCallAddress = Array.isArray(addressOrAddresses) ? addressOrAddresses[0] : addressOrAddresses
  if (!createCallAddress) {
    throw new Error('No CreateCall address for this chain')
  }
  const iface = new Interface(deployment.abi)
  return {
    to: createCallAddress,
    value: '0',
    data: iface.encodeFunctionData('performCreate', ['0', data]),
    operation: 0,
  }
}

const toMetaTx = (call: DappCall, chain: Chain, safeVersion: SafeState['version']): MetaTransactionData => {
  if (!call.to) {
    // Router already ruled out the invalid no-to cases, so this is a contract deployment.
    return buildCreateCallTx(chain, safeVersion, call.data ?? '0x')
  }
  return {
    to: call.to,
    value: normalizeValue(call.value),
    data: call.data ?? '0x',
    operation: 0,
  }
}

/**
 * Build a SafeTransaction from dApp calls (batches auto-wrap via multiSend) and run the shared
 * draft pipeline (see previewAndStashDraft). Returns the safeTxHash used as the downstream txId.
 */
export const composeSafeTxDraft = async ({
  calls,
  chainId,
  safeAddress,
  safe,
  chain,
  dispatch,
}: ComposeSafeTxDraftInput): Promise<string> => {
  if (calls.length === 0) {
    throw new Error('composeSafeTxDraft: empty calls array')
  }

  const safeSDK = await getVerifiedSafeSDK(chainId)
  const metaTxs: MetaTransactionData[] = calls.map((c) => toMetaTx(c, chain, safe.version))
  const safeTx = await safeSDK.createTransaction({ transactions: metaTxs })

  return previewAndStashDraft({ safeSDK, safeTx, chainId, safeAddress, safe, dispatch })
}
