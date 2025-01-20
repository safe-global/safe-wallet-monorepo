import TokenIcon from '@/components/common/TokenIcon'
import FieldsGrid from '@/components/tx/FieldsGrid'
import { formatVisualAmount } from '@/utils/formatters'
import { Box, Typography } from '@mui/material'
import { type TokenInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { type ReactNode } from 'react'

const SendAmountBlock = ({
  amountInWei,
  tokenInfo,
  children,
  title = 'Send:',
  safenet = false,
  tokenSize,
}: {
  /** Amount in WEI */
  amountInWei: number | string
  tokenInfo: Omit<TokenInfo, 'name' | 'logoUri'> & { logoUri?: string }
  children?: ReactNode
  title?: string
  safenet?: boolean
  tokenSize?: number
}) => {
  return (
    <FieldsGrid title={title}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <TokenIcon logoUri={tokenInfo.logoUri} tokenSymbol={tokenInfo.symbol} safenet={safenet} size={tokenSize} />

        <Typography
          sx={{
            fontWeight: 'bold',
          }}
        >
          {tokenInfo.symbol}
        </Typography>

        {children}

        <Typography data-testid="token-amount">
          {formatVisualAmount(amountInWei, tokenInfo.decimals, tokenInfo.decimals)}
        </Typography>
      </Box>
    </FieldsGrid>
  )
}

export default SendAmountBlock
