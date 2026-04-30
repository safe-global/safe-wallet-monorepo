import Safe from '@safe-global/protocol-kit'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import {
  signSafeTxWithPasskey,
  type PasskeyGetFn,
  type PasskeyMetadata,
  type RelayClient,
} from '@safe-global/utils/services/passkey'
import { GATEWAY_URL } from '@/src/config/constants'
import { getRpcServiceUrl } from '@/src/services/web3'
import { fetchTransactionDetails } from '@/src/services/tx/fetchTransactionDetails'
import extractTxInfo from '@/src/services/tx/extractTx'
import { mobilePasskeyStorage } from '@/src/services/passkey/passkey-storage.service'
import { authenticatePasskey } from '@/src/services/passkey/passkey.service'
import { SafeInfo } from '@/src/types/address'
import logger from '@/src/utils/logger'

export interface SignWithPasskeyParams {
  chain: Chain
  activeSafe: SafeInfo
  txId: string
  passkeyMetadata: PasskeyMetadata
  relay: RelayClient
}

export async function signWithPasskey({
  chain,
  activeSafe,
  txId,
  passkeyMetadata,
  relay,
}: SignWithPasskeyParams): Promise<{ signature: string; safeTransactionHash: string }> {
  if (!chain) {
    throw new Error('Active chain not found')
  }

  const rpcUrl = getRpcServiceUrl(chain.rpcUri)

  // Build the SafeTransaction from CGW. This requires a protocol-kit init
  // (without the signer) to access `createTransaction`. Done in parallel
  // with the network fetch.
  const [protocolKit, txDetails] = await Promise.all([
    Safe.init({ provider: rpcUrl, safeAddress: activeSafe.address }),
    fetchTransactionDetails(activeSafe.chainId, txId),
  ])

  const { txParams } = extractTxInfo(txDetails, activeSafe.address)
  const safeTx = await protocolKit.createTransaction({ transactions: [txParams] })

  const getFn: PasskeyGetFn = authenticatePasskey

  const { signedTx, safeTransactionHash } = await signSafeTxWithPasskey({
    rpcUrl,
    chainId: chain.chainId,
    safeAddress: activeSafe.address,
    safeTx,
    passkey: passkeyMetadata,
    getFn,
    relay,
    storage: mobilePasskeyStorage,
    cgwBaseUrl: GATEWAY_URL,
  })

  const signature = signedTx.encodedSignatures()
  logger.info('[passkey-sign] safeTransactionHash:', safeTransactionHash)
  if (!signature || signature === '0x') {
    throw new Error('Failed to get passkey signature')
  }
  return { signature, safeTransactionHash }
}
