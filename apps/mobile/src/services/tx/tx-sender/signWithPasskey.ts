import Safe, { PasskeyArgType, getP256VerifierAddress } from '@safe-global/protocol-kit'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { createWeb3ReadOnly, getRpcServiceUrl } from '@/src/services/web3'
import { fetchTransactionDetails } from '@/src/services/tx/fetchTransactionDetails'
import extractTxInfo from '@/src/services/tx/extractTx'
import { authenticatePasskey } from '@/src/services/passkey/passkey.service'
import { PasskeyMetadata } from '@/src/services/passkey/passkey-storage.service'
import { SafeInfo } from '@/src/types/address'
import logger from '@/src/utils/logger'

export interface SignWithPasskeyParams {
  chain: Chain
  activeSafe: SafeInfo
  txId: string
  passkeyMetadata: PasskeyMetadata
}

export async function signWithPasskey({ chain, activeSafe, txId, passkeyMetadata }: SignWithPasskeyParams): Promise<{
  signature: string
  safeTransactionHash: string
}> {
  if (!chain) {
    throw new Error('Active chain not found')
  }

  const provider = createWeb3ReadOnly(chain)
  if (!provider) {
    throw new Error('Failed to create provider')
  }

  const rpcUrl = getRpcServiceUrl(chain.rpcUri)

  // Build the passkey signer for protocol-kit (v7 requires verifierAddress)
  const passkeySigner: PasskeyArgType = {
    rawId: passkeyMetadata.rawId,
    coordinates: passkeyMetadata.coordinates,
    verifierAddress: getP256VerifierAddress(chain.chainId),
    getFn: authenticatePasskey,
  }

  // Parallelize protocol-kit init and tx details fetch — both are slow network calls
  const [protocolKit, txDetails] = await Promise.all([
    Safe.init({
      provider: rpcUrl,
      signer: passkeySigner,
      safeAddress: activeSafe.address,
    }),
    fetchTransactionDetails(activeSafe.chainId, txId),
  ])

  const { txParams } = extractTxInfo(txDetails, activeSafe.address)
  const safeTx = await protocolKit.createTransaction({ transactions: [txParams] })

  // Sign with passkey — triggers OS biometric prompt
  const signedSafeTx = await protocolKit.signTransaction(safeTx)

  const safeTransactionHash = await protocolKit.getTransactionHash(signedSafeTx)

  // Send the full encoded signature (includes signer address, dynamic offset,
  // v=0x00, length, and inner data). CGW stores this as-is and returns it
  // in confirmations. The execution layer must handle this format.
  const signature = signedSafeTx.encodedSignatures()

  logger.info('[passkey-sign] safeTransactionHash:', safeTransactionHash)
  logger.info('[passkey-sign] signature length:', signature.length)

  if (!signature || signature === '0x') {
    throw new Error('Failed to get passkey signature')
  }

  return { signature, safeTransactionHash }
}
