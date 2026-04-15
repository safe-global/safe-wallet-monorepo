import { getUserNonce } from '@/src/services/web3'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { getSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { fetchTransactionDetails } from '@/src/services/tx/fetchTransactionDetails'
import extractTxInfo from '@/src/services/tx/extractTx'
import { createExistingTx } from '@/src/services/tx/tx-sender/create'
import { generatePreValidatedSignature } from '@safe-global/protocol-kit/dist/src/utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import logger from '@/src/utils/logger'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeInfo } from '@/src/types/address'
import type { Provider } from '@reown/appkit-common-react-native'
import { maybePlural } from '@safe-global/utils/utils/formatters'

interface ExecuteWalletConnectTxParams {
  chain: Chain
  activeSafe: SafeInfo
  txId: string
  signerAddress: string
  provider: Provider
}

interface ExecuteWalletConnectTxResult {
  type: ExecutionMethod.WITH_WC
  txId: string
  chainId: string
  safeAddress: string
  txHash: string
  walletAddress: string
  walletNonce: number
}

export const executeWalletConnectTx = async ({
  chain,
  activeSafe,
  txId,
  signerAddress,
  provider,
}: ExecuteWalletConnectTxParams): Promise<ExecuteWalletConnectTxResult> => {
  const sdk = getSafeSDK()
  if (!sdk) {
    throw new Error('Safe SDK not initialized')
  }

  const txDetails = await fetchTransactionDetails(activeSafe.chainId, txId)
  const { txParams, signatures } = extractTxInfo(txDetails, activeSafe.address)
  const safeTx = await createExistingTx(txParams, signatures)

  // Add pre-validated signatures for owners who have approved on-chain
  const threshold = await sdk.getThreshold()
  const owners = await sdk.getOwners()
  const txHash = await sdk.getTransactionHash(safeTx)
  const ownersWhoApprovedTx = await sdk.getOwnersWhoApprovedTx(txHash)

  for (const owner of ownersWhoApprovedTx) {
    if (!safeTx.signatures.has(owner.toLowerCase())) {
      safeTx.addSignature(generatePreValidatedSignature(owner))
    }
  }

  // If executor is an owner and we still need signatures, add pre-validated
  const isOwner = owners.some((o) => sameAddress(o, signerAddress))
  if (threshold > safeTx.signatures.size && isOwner) {
    safeTx.addSignature(generatePreValidatedSignature(signerAddress))
  }

  if (threshold > safeTx.signatures.size) {
    const missing = threshold - safeTx.signatures.size
    throw new Error(`There ${missing > 1 ? 'are' : 'is'} ${missing} signature${maybePlural(missing)} missing`)
  }

  const encodedTx = await sdk.getEncodedTransaction(safeTx)

  // Fetch nonce before sending to capture the pre-tx nonce for the pending tx watcher
  const walletNonce = await getUserNonce(chain, signerAddress)

  logger.info('Sending execution via WalletConnect', {
    signerAddress,
    txId,
    threshold,
    signaturesCount: safeTx.signatures.size,
  })

  const txHashResult = await provider.request<string>({
    method: 'eth_sendTransaction',
    params: [
      {
        from: signerAddress,
        to: activeSafe.address,
        data: encodedTx,
      },
    ],
  })

  logger.info('Transaction executed via WalletConnect', {
    signerAddress,
    txId,
    txHash: txHashResult,
  })

  return {
    type: ExecutionMethod.WITH_WC,
    txId,
    chainId: chain.chainId,
    safeAddress: activeSafe.address,
    txHash: txHashResult,
    walletAddress: signerAddress,
    walletNonce,
  }
}
