import TokenIcon from '@/components/common/TokenIcon'
import css from '@/components/tx/ApprovalEditor/styles.module.css'
import type { Approval } from '@safe-global/utils/services/security/modules/ApprovalModule'
import { Typography } from '@/components/ui/typography'
import { TokenType } from '@safe-global/store/gateway/types'
import type { ApprovalInfo } from './hooks/useApprovalInfos'
import { PSEUDO_APPROVAL_VALUES } from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { formatAmountPrecise } from '@safe-global/utils/utils/formatNumber'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

export const approvalMethodDescription: Record<
  Approval['method'],
  (symbol: string, type?: Balance['tokenInfo']['type']) => string
> = {
  approve: (symbol: string, type?: Balance['tokenInfo']['type']) =>
    type === TokenType.ERC721 ? `Allow to transfer ${symbol}` : `Set ${symbol} allowance to`,
  increaseAllowance: (symbol: string) => `Increase ${symbol} allowance by`,
  Permit2: (symbol: string) => `Give permission to spend ${symbol}`,
  Permit: (symbol: string) => `Give permission to spend ${symbol}`,
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
    <div className={`${css.approvalField} flex flex-row items-center gap-4`}>
      <TokenIcon size={32} logoUri={tokenInfo?.logoUri} tokenSymbol={tokenInfo?.symbol} />
      <div className="overflow-x-auto">
        <Typography variant="paragraph-small" className="text-muted-foreground">
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
      </div>
    </div>
  )
}

export default ApprovalItem
