import { selectActiveChainCurrency } from '@/src/store/chains'
import { useAppSelector } from '@/src/store/hooks'
import { formatValue } from '@/src/utils/formatters'
import { isERC20Transfer, isERC721Transfer, isNativeTokenTransfer } from '@/src/utils/transaction-guards'
import { TransferTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ellipsis } from '@safe-global/utils/formatters'

interface tokenDetails {
  value: string
  decimals?: number
  tokenSymbol?: string
  name: string
  logoUri?: string
}

export const useTokenDetails = (txInfo: TransferTransactionInfo): tokenDetails => {
  const transfer = txInfo.transferInfo
  const unnamedToken = 'Unnamed token'
  const nativeCurrency = useAppSelector(selectActiveChainCurrency)

  if (isNativeTokenTransfer(transfer) && nativeCurrency) {
    return {
      value: formatValue(transfer.value || '0', nativeCurrency.decimals),
      // take it from the native currency slice
      decimals: nativeCurrency.decimals,
      tokenSymbol: nativeCurrency.symbol,
      name: nativeCurrency.name,
      logoUri: nativeCurrency.logoUri,
    }
  }

  if (isERC20Transfer(transfer)) {
    return {
      value: formatValue(transfer.value, transfer.decimals || 18),
      decimals: transfer.decimals || undefined,
      logoUri: transfer.logoUri || undefined,
      tokenSymbol: ellipsis((transfer.tokenSymbol || 'Unknown Token').trim(), 6),
      name: transfer.tokenName || unnamedToken,
    }
  }

  if (isERC721Transfer(transfer)) {
    return {
      name: transfer.tokenName || unnamedToken,
      tokenSymbol: ellipsis(`${transfer.tokenSymbol || 'Unknown NFT'} #${transfer.tokenId}`, 8),
      value: '1',
      decimals: 0,
      logoUri: transfer?.logoUri || undefined,
    }
  }

  return {
    name: unnamedToken,
    value: '',
  }
}
