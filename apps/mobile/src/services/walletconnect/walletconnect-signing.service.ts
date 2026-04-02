import type { Chain as ChainInfo } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeVersion } from '@safe-global/types-kit'
import { generateTypedData } from '@safe-global/protocol-kit/dist/src/utils/eip-712'
import { TypedDataEncoder } from 'ethers'
import { createExistingTx } from '../tx/tx-sender/create'
import extractTxInfo from '../tx/extractTx'
import logger from '@/src/utils/logger'
import { SafeInfo } from '@/src/types/address'
import { fetchTransactionDetails } from '../tx/fetchTransactionDetails'
import type { Provider } from '@reown/appkit-common-react-native'
import { SigningMethod } from '@safe-global/protocol-kit'

export interface WalletConnectSigningParams {
  chain: ChainInfo
  activeSafe: SafeInfo
  txId: string
  signerAddress: string
  safeVersion: SafeVersion
  provider: Provider
}

export interface SigningResponse {
  signature: string
  safeTransactionHash: string
}

export const signWithWalletConnect = async (params: WalletConnectSigningParams): Promise<SigningResponse> => {
  const { chain, activeSafe, txId, signerAddress, safeVersion, provider } = params

  const txDetails = await fetchTransactionDetails(activeSafe.chainId, txId)
  const { txParams, signatures } = extractTxInfo(txDetails, activeSafe.address)
  const safeTx = await createExistingTx(txParams, signatures)

  const typedData = generateTypedData({
    safeAddress: activeSafe.address,
    safeVersion,
    chainId: BigInt(chain.chainId),
    data: safeTx.data,
  })

  const typesObj = typedData.types as unknown as Record<string, unknown>
  const { EIP712Domain: _, ...types } = typesObj

  const safeTransactionHash = TypedDataEncoder.hash(
    typedData.domain as Record<string, unknown>,
    types as Record<string, { name: string; type: string }[]>,
    typedData.message,
  )

  const signature = await provider.request({
    method: SigningMethod.ETH_SIGN_TYPED_DATA_V4,
    params: [signerAddress, JSON.stringify(typedData)],
  })

  if (typeof signature !== 'string') {
    throw new Error('Invalid signature received from wallet')
  }

  logger.info('Successfully signed transaction via WalletConnect', {
    signerAddress,
    safeTransactionHash,
    txId,
  })

  return {
    signature,
    safeTransactionHash,
  }
}
