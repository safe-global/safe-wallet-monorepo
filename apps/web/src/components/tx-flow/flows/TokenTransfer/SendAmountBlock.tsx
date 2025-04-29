import { type ReactNode } from 'react'
import { type TokenInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { Box, Typography } from '@mui/material'
import TokenIcon from '@/components/common/TokenIcon'
import FieldsGrid from '@/components/tx/FieldsGrid'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'

const SendAmountBlock = ({
  amountInWei,
  tokenInfo,
  children,
  title = 'Send',
}: {
  /** Amount in WEI */
  amountInWei: number | string
  tokenInfo: Omit<TokenInfo, 'name' | 'logoUri'> & { logoUri?: string }
  children?: ReactNode
  title?: string
}) => {
  return (
    <FieldsGrid title={title}>
      <Box display="flex" alignItems="center" gap={1}>
        <TokenIcon logoUri={tokenInfo.logoUri} tokenSymbol={tokenInfo.symbol} />

        <Typography variant="body2" fontWeight="bold">
          {tokenInfo.symbol}
        </Typography>

        {children}

        <Typography variant="body2" data-testid="token-amount">
          {formatVisualAmount(amountInWei, tokenInfo.decimals, tokenInfo.decimals ?? 0)}
        </Typography>
      </Box>
    </FieldsGrid>
  )
}

export default SendAmountBlock
