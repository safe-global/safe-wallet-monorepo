import { type ReactNode, useMemo } from 'react'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import FiatValue from '@/components/common/FiatValue'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import { type TokenInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { computeFiatValue } from '@/utils/fiat'
import { SendAmountBlockView } from '@views/components/tx-flow/flows/TokenTransfer/SendAmountBlockView'

const SendAmountBlock = ({
  amountInWei,
  tokenInfo,
  children,
  title,
  fiatConversion,
}: {
  /** Amount in WEI */
  amountInWei: number | string
  tokenInfo: Balance['tokenInfo'] | TokenInfo
  children?: ReactNode
  title?: string
  fiatConversion?: string
  compact?: boolean
}) => {
  const fiatValue = useMemo(
    () => computeFiatValue(parseFloat(safeFormatUnits(amountInWei, tokenInfo.decimals)), fiatConversion),
    [amountInWei, tokenInfo.decimals, fiatConversion],
  )

  return (
    <SendAmountBlockView
      amountInWei={amountInWei}
      tokenInfo={tokenInfo}
      title={title}
      hasFiatValue={fiatValue != null}
      fiatValue={fiatValue != null && <FiatValue value={fiatValue} />}
    >
      {children}
    </SendAmountBlockView>
  )
}

export default SendAmountBlock
