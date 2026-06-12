import { type ReactNode, useMemo } from 'react'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { Typography } from '@/components/ui/typography'
import TokenIcon from '@/components/common/TokenIcon'
import FiatValue from '@/components/common/FiatValue'
import FieldsGrid from '@/components/tx/FieldsGrid'
import { formatVisualAmount, safeFormatUnits } from '@safe-global/utils/utils/formatters'
import { type TokenInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { computeFiatValue } from '@/utils/fiat'

const SendAmountBlock = ({
  amountInWei,
  tokenInfo,
  children,
  title = 'Send',
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
    <FieldsGrid title={title}>
      <div className="flex items-center gap-2">
        <TokenIcon logoUri={tokenInfo.logoUri ?? undefined} tokenSymbol={tokenInfo.symbol} />

        <Typography variant="paragraph-small-bold">{tokenInfo.symbol}</Typography>

        {children}

        <Typography variant="paragraph-small" data-testid="token-amount">
          {formatVisualAmount(amountInWei, tokenInfo.decimals, tokenInfo.decimals ?? 0)}
        </Typography>

        {fiatValue != null && (
          <Typography variant="paragraph-small" className="text-muted-foreground">
            (<FiatValue value={fiatValue} />)
          </Typography>
        )}
      </div>
    </FieldsGrid>
  )
}

export default SendAmountBlock
