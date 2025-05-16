import {
  type Erc20Token,
  type NativeToken,
  type TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useMemo } from 'react'
import { ERC20__factory } from '@safe-global/utils/types/contracts'
import { isEmptyHexData } from '@/utils/hex'
import { useNativeTokenInfo } from '@/hooks/useNativeTokenInfo'

const ERC20_INTERFACE = ERC20__factory.createInterface()

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
  const isERC20Transfer = Boolean(data?.startsWith(ERC20_INTERFACE.getFunction('transfer').selector))
  const isNativeTransfer = value !== '0' && (!data || isEmptyHexData(data))

  return useMemo(() => {
    if (!isERC20Transfer && !isNativeTransfer) {
      return
    }
    try {
      if (isERC20Transfer) {
        if (!data) {
          return
        }
        const [recipient, transferValue] = ERC20_INTERFACE.decodeFunctionData('transfer', data)
        const tokenInfo = isERC20Transfer ? tokenInfoIndex?.[to] : undefined

        if (tokenInfo?.type !== 'ERC20') {
          return
        }

        return { recipient, transferValue, tokenInfo }
      }

      if (!value || value === '0') {
        return
      }

      return {
        recipient: to,
        transferValue: value,
        tokenInfo: nativeTokenInfo,
      }
    } catch (error) {
      return
    }
  }, [isERC20Transfer, isNativeTransfer, value, nativeTokenInfo, to, data, tokenInfoIndex])
}
