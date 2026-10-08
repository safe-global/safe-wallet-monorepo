import { type ReactNode } from 'react'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { Typography } from '@/components/ui/typography'
import TokenIcon from '@/components/common/TokenIcon'
import FieldsGrid from '@/components/tx/FieldsGrid'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { type TokenInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export type SendAmountBlockViewProps = {
  amountInWei: number | string
  tokenInfo: Balance['tokenInfo'] | TokenInfo
  children?: ReactNode
  title?: string
  hasFiatValue: boolean
  fiatValue: ReactNode
}

const SendAmountBlockView = ({
  amountInWei,
  tokenInfo,
  children,
  title = 'Send',
  hasFiatValue,
  fiatValue,
}: SendAmountBlockViewProps) => {
  return (
    <FieldsGrid title={title}>
      <div className="flex items-center gap-2">
        <TokenIcon logoUri={tokenInfo.logoUri ?? undefined} tokenSymbol={tokenInfo.symbol} />

        <Typography variant="paragraph-small-bold">{tokenInfo.symbol}</Typography>

        {children}

        <Typography variant="paragraph-small" data-testid="token-amount">
          {formatVisualAmount(amountInWei, tokenInfo.decimals, tokenInfo.decimals ?? 0)}
        </Typography>

        {hasFiatValue && (
          <Typography variant="paragraph-small" className="text-muted-foreground">
            ({fiatValue})
          </Typography>
        )}
      </div>
    </FieldsGrid>
  )
}

export { SendAmountBlockView }
