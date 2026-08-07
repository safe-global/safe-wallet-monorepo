import { type ReactNode, useMemo } from 'react'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { Box, Typography } from '@mui/material'
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
  compact = false,
  fiatConversion,
}: {
  /** Amount in WEI */
  amountInWei: number | string
  tokenInfo: Balance['tokenInfo'] | TokenInfo
  children?: ReactNode
  title?: string
  /** Inline layout without FieldsGrid wrapper */
  compact?: boolean
  fiatConversion?: string
}) => {
  const fiatValue = useMemo(
    () => computeFiatValue(parseFloat(safeFormatUnits(amountInWei, tokenInfo.decimals)), fiatConversion),
    [amountInWei, tokenInfo.decimals, fiatConversion],
  )

  const content = (
    <Box display="flex" alignItems="center" gap={1}>
      <TokenIcon
        logoUri={tokenInfo.logoUri ?? undefined}
        tokenSymbol={tokenInfo.symbol}
        size={compact ? 32 : undefined}
      />

      {!compact && (
        <Typography variant="body2" fontWeight="bold">
          {tokenInfo.symbol}
        </Typography>
      )}

      {children}

      <Typography variant={compact ? 'body1' : 'body2'} data-testid="token-amount">
        {formatVisualAmount(amountInWei, tokenInfo.decimals, tokenInfo.decimals ?? 0)}
        {compact && ` ${tokenInfo.symbol}`}
      </Typography>

      {fiatValue != null && (
        <Typography variant="body2" color="text.secondary" component="span">
          (<FiatValue value={fiatValue} />)
        </Typography>
      )}
    </Box>
  )

  if (compact) {
    return (
      <Box display="flex" alignItems="center" gap={3} pr={2}>
        <Typography variant="body2" fontWeight={700} letterSpacing="0.1px">
          {title}
        </Typography>
        {content}
      </Box>
    )
  }

  return <FieldsGrid title={title}>{content}</FieldsGrid>
}

export default SendAmountBlock
