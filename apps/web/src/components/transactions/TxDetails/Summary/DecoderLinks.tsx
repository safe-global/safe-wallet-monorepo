import ExternalLink from '@/components/common/ExternalLink'
import { Typography } from '@mui/material'

const TX_DECODER_URL = 'https://transaction-decoder.pages.dev'
const SAFE_UTILS_URL = 'https://safeutils.openzeppelin.com'
const CYFRIN_SAFE_HASH_URL = 'https://tools.cyfrin.io/safe-hash'
const CYFRIN_ABI_ENCODING_URL = 'https://tools.cyfrin.io/abi-encoding'

type SafeWalletData = {
  safeAddress?: string
  chainId?: string
  safeVersion?: string
  nonce?: number
}

type TransactionData = {
  to?: string
  value?: string
  data?: string
  operation?: string
  safeTxGas?: string
  baseGas?: string
  gasPrice?: string
  gasToken?: string
  refundReceiver?: string
}

type DecoderLinksProps = {
  safeWallet?: SafeWalletData
  transaction?: TransactionData
}

const DecoderLinks = ({ safeWallet, transaction }: DecoderLinksProps = {}) => {
  const buildSafeHashUrl = () => {
    if (!safeWallet || !transaction) return CYFRIN_SAFE_HASH_URL
    
    const params = new URLSearchParams()
    if (safeWallet.safeAddress) params.append('safeAddress', safeWallet.safeAddress)
    if (safeWallet.chainId) params.append('chainId', safeWallet.chainId)
    if (safeWallet.safeVersion) params.append('safeVersion', safeWallet.safeVersion)
    if (safeWallet.nonce !== undefined) params.append('nonce', safeWallet.nonce.toString())
    if (transaction.to) params.append('to', transaction.to)
    if (transaction.value) params.append('value', transaction.value)
    if (transaction.data) params.append('data', transaction.data)
    if (transaction.operation) params.append('operation', transaction.operation)
    if (transaction.safeTxGas) params.append('safeTxGas', transaction.safeTxGas)
    if (transaction.baseGas) params.append('baseGas', transaction.baseGas)
    if (transaction.gasPrice) params.append('gasPrice', transaction.gasPrice)
    if (transaction.gasToken) params.append('gasToken', transaction.gasToken)
    if (transaction.refundReceiver) params.append('refundReceiver', transaction.refundReceiver)
    
    return `${CYFRIN_SAFE_HASH_URL}?${params.toString()}`
  }

  const buildAbiEncodingUrl = () => {
    if (!transaction?.data) return CYFRIN_ABI_ENCODING_URL
    
    const params = new URLSearchParams()
    params.append('data', transaction.data)
    
    return `${CYFRIN_ABI_ENCODING_URL}?${params.toString()}`
  }

  const safeUtilsUrl = buildSafeHashUrl()
  const transactionDecoderUrl = buildAbiEncodingUrl()

  return (
    <Typography variant="body2" color="primary.light" mb={3}>
      Cross-verify your transaction data with external tools like{' '}
      <ExternalLink href={safeUtilsUrl}>Safe Hash Calculator</ExternalLink> and{' '}
      <ExternalLink href={transactionDecoderUrl}>Transaction Decoder</ExternalLink>.
    </Typography>
  )
}

export default DecoderLinks
