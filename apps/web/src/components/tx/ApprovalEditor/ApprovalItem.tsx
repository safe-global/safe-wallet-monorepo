import TokenIcon from '@/components/common/TokenIcon'
import css from '@/components/tx/ApprovalEditor/styles.module.css'
import type { Approval } from '@/services/security/modules/ApprovalModule'
import { Box, Stack, Typography } from '@mui/material'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk/dist/types/common'
import type { ApprovalInfo } from './hooks/useApprovalInfos'
import { PSEUDO_APPROVAL_VALUES } from './utils/approvals'
import { formatAmountPrecise } from '@/utils/formatNumber'
import type { Token } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

export const approvalMethodDescription: Record<Approval['method'], (symbol: string, type?: Token['type']) => string> = {
  approve: (symbol: string, type?: Token['type']) =>
    type === TokenType.ERC721 ? `Allow to transfer ${symbol}` : `Set ${symbol} allowance to`,
  increaseAllowance: (symbol: string) => `Increase ${symbol} allowance by`,
  Permit2: (symbol: string) => `Give permission to spend ${symbol}`,
}

const ApprovalItem = ({
  method,
  amount,
  rawAmount,
  tokenInfo,
}: {
  spender: string
  amount: string
  rawAmount: any
  tokenInfo: NonNullable<ApprovalInfo['tokenInfo']>
  method: Approval['method']
}) => {
  return (
    <Stack
      direction="row"
      className={css.approvalField}
      sx={{
        alignItems: 'center',
        gap: 2,
      }}
    >
      <TokenIcon size={32} logoUri={tokenInfo?.logoUri} tokenSymbol={tokenInfo?.symbol} />
      <Box sx={{ overflowX: 'auto' }}>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
          }}
        >
          {approvalMethodDescription[method](tokenInfo.symbol ?? '', tokenInfo.type)}
        </Typography>
        {amount === PSEUDO_APPROVAL_VALUES.UNLIMITED ? (
          <Typography>{PSEUDO_APPROVAL_VALUES.UNLIMITED}</Typography>
        ) : (
          <Typography data-testid="token-amount">
            {tokenInfo.type === TokenType.ERC20
              ? formatAmountPrecise(amount, tokenInfo.decimals ?? 0)
              : `#${rawAmount.toString()}`}
          </Typography>
        )}
      </Box>
    </Stack>
  )
}

export default ApprovalItem
