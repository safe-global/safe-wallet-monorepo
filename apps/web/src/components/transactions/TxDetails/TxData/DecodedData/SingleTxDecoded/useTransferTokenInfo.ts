import {
  type Erc20Token,
  type NativeToken,
  type TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useNativeTokenInfo } from '@/hooks/useNativeTokenInfo'
import { useTxTokenInfo } from '@safe-global/utils/hooks/useTxTokenInfo'

export const useTransferTokenInfo = (
  data: string | undefined,
  value: string | undefined,
  to: string,
  tokenInfoIndex?: NonNullable<TransactionDetails['txData']>['tokenInfoIndex'],
):
  | {
      recipient: string
      transferValue: string
      tokenInfo: Erc20Token | NativeToken
    }
  | undefined => {
  const nativeTokenInfo = useNativeTokenInfo()

  return useTxTokenInfo(data, value, to, nativeTokenInfo, tokenInfoIndex)
}
