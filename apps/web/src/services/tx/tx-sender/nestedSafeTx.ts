import type { Eip1193Provider, JsonRpcProvider } from 'ethers'
import { getAddress } from 'viem'
import type { SafeTransaction } from '@safe-global/types-kit'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { initSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { tryOffChainTxSigning } from '@/services/tx/tx-sender/sdk'

/**
 * Build and off-chain sign the parent Safe's `approveHash` transaction for a child Safe's tx.
 *
 * In a nested Safe setup (parent `P` owns child `C`), this produces
 * `TX_P = P.execTransaction(to=C, data=approveHash(childSafeTxHash))` signed by the connected
 * EOA owner of `P`. It does NOT execute or relay — the caller proposes `TX_P` to `P`'s queue and
 * the user relays it separately. No fees are applied to `TX_P` (it is sponsored).
 *
 * Mirrors the build path of `getNestedWallet.send` but stops before execution.
 */
export const prepareNestedApproveHashTx = async ({
  parentSafe,
  childSafeAddress,
  childSafeTxHash,
  connectedWalletProvider,
  readOnlyProvider,
}: {
  parentSafe: SafeState
  childSafeAddress: string
  childSafeTxHash: string
  connectedWalletProvider: Eip1193Provider
  readOnlyProvider: JsonRpcProvider
}): Promise<{ parentSafeTx: SafeTransaction; parentSafeTxHash: string }> => {
  const parentSdk = await initSafeSDK({
    provider: readOnlyProvider,
    chainId: parentSafe.chainId,
    address: parentSafe.address.value,
    version: parentSafe.version,
    implementationVersionState: parentSafe.implementationVersionState,
    implementation: parentSafe.implementation.value,
  })

  const connectedParentSdk = await parentSdk?.connect({ provider: connectedWalletProvider })

  if (!connectedParentSdk) {
    throw new Error('Could not initialize the parent Safe SDK')
  }

  const safeContract = connectedParentSdk.getContractManager().safeContract
  if (!safeContract) {
    throw new Error('Parent Safe is not deployed')
  }

  // @ts-ignore - encode's overloads on the contract type produce a union too complex to represent
  const approveHashData = safeContract.encode('approveHash', [childSafeTxHash])

  const parentSafeTx = await connectedParentSdk.createTransaction({
    transactions: [
      {
        to: getAddress(childSafeAddress),
        value: '0',
        data: approveHashData,
        operation: 0,
      },
    ],
    onlyCalls: true,
  })

  const parentSafeTxHash = await connectedParentSdk.getTransactionHash(parentSafeTx)

  const signedParentSafeTx = await tryOffChainTxSigning(parentSafeTx, connectedParentSdk)

  return { parentSafeTx: signedParentSafeTx, parentSafeTxHash }
}
