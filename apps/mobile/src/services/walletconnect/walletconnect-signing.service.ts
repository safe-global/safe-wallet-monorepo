import type { Chain as ChainInfo } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeTransaction, SafeVersion } from '@safe-global/types-kit'
import { generateTypedData } from '@safe-global/protocol-kit'
import { SigningMethod } from '@safe-global/types-kit'
import { TypedDataEncoder } from 'ethers'
import { createExistingTx } from '../tx/tx-sender/create'
import extractTxInfo from '../tx/extractTx'
import logger from '@/src/utils/logger'
import { SafeInfo } from '@/src/types/address'
import { fetchTransactionDetails } from '../tx/fetchTransactionDetails'
import type { Provider } from '@reown/appkit-common-react-native'

export interface WalletConnectSigningParams {
  chain: ChainInfo
  activeSafe: SafeInfo
  txId: string
  signerAddress: string
  safeVersion: SafeVersion
  provider: Provider
  /**
   * Pre-built SafeTransaction for un-proposed (draft) transactions. When
   * supplied, the service signs this transaction directly instead of
   * fetching its data from CGW by `txId`.
   */
  prebuiltSafeTx?: SafeTransaction
}

export interface SigningResponse {
  signature: string
  safeTransactionHash: string
}

// domain.chainId → number (EIP-712 uint256; a string is rejected by strict wallets), scoped to
// the domain so a chainId elsewhere in the message isn't coerced. All other bigints → string to
// keep uint256 precision. Exported for the hash-preservation test.
export const stringifyTypedData = (typedData: { domain: { chainId?: bigint | number } }): string => {
  const { chainId } = typedData.domain
  if (typeof chainId === 'bigint' && chainId > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`chainId ${chainId} exceeds Number.MAX_SAFE_INTEGER`)
  }
  const domain = typeof chainId === 'bigint' ? { ...typedData.domain, chainId: Number(chainId) } : typedData.domain
  return JSON.stringify({ ...typedData, domain }, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value,
  )
}

export const signWithWalletConnect = async (params: WalletConnectSigningParams): Promise<SigningResponse> => {
  const { chain, activeSafe, txId, signerAddress, safeVersion, provider, prebuiltSafeTx } = params

  let safeTx: SafeTransaction
  if (prebuiltSafeTx) {
    safeTx = prebuiltSafeTx
  } else {
    const txDetails = await fetchTransactionDetails(activeSafe.chainId, txId)
    const { txParams, signatures } = extractTxInfo(txDetails, activeSafe.address)
    safeTx = await createExistingTx(txParams, signatures)
  }

  const typedData = generateTypedData({
    safeAddress: activeSafe.address,
    safeVersion,
    chainId: BigInt(chain.chainId),
    data: safeTx.data,
  })

  // TypedDataEncoder.hash expects types without EIP712Domain
  const { EIP712Domain: _, ...types } = typedData.types as unknown as Record<string, unknown>

  if (!Object.keys(types).length) {
    throw new Error('Typed data contains no types besides EIP712Domain')
  }

  const safeTransactionHash = TypedDataEncoder.hash(
    typedData.domain as Record<string, unknown>,
    types as Record<string, { name: string; type: string }[]>,
    typedData.message,
  )

  const signature = await provider.request({
    method: SigningMethod.ETH_SIGN_TYPED_DATA_V4,
    params: [signerAddress, stringifyTypedData(typedData)],
  })

  if (typeof signature !== 'string') {
    throw new Error('Invalid signature received from wallet')
  }

  logger.info('Successfully signed transaction via WalletConnect', {
    signerAddress,
    safeTransactionHash,
    ...(prebuiltSafeTx ? {} : { txId }),
  })

  return {
    signature,
    safeTransactionHash,
  }
}
