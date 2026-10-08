import TokenIcon from '@/components/common/TokenIcon'
import css from './styles.module.css'
import type { Approval } from '@safe-global/utils/services/security/modules/ApprovalModule'
import { Typography } from '@/components/ui/typography'
import { formatAmountPrecise } from '@safe-global/utils/utils/formatNumber'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { ApprovalInfo } from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'

export const approvalMethodDescription: Record<
  Approval['method'],
  (symbol: string, type?: Balance['tokenInfo']['type']) => string
> = {
  approve: (symbol: string, type?: Balance['tokenInfo']['type']) =>
    type === 'ERC721' ? `Allow to transfer ${symbol}` : `Set ${symbol} allowance to`,
  increaseAllowance: (symbol: string) => `Increase ${symbol} allowance by`,
  Permit2: (symbol: string) => `Give permission to spend ${symbol}`,
  Permit: (symbol: string) => `Give permission to spend ${symbol}`,
}

export type ApprovalItemViewProps = {
  method: Approval['method']
  amount: string
  rawAmount: { toString: () => string }
  tokenInfo: NonNullable<ApprovalInfo['tokenInfo']>
  isUnlimited: boolean
  isErc20: boolean
}

export const ApprovalItemView = ({
  method,
  amount,
  rawAmount,
  tokenInfo,
  isUnlimited,
  isErc20,
}: ApprovalItemViewProps) => {
  return (
    <div className={`${css.approvalField} flex flex-row items-center gap-4`}>
      <TokenIcon size={32} logoUri={tokenInfo?.logoUri} tokenSymbol={tokenInfo?.symbol} />
      <div className="overflow-x-auto">
        <Typography variant="paragraph-small" className="text-muted-foreground">
          {approvalMethodDescription[method](tokenInfo.symbol ?? '', tokenInfo.type)}
        </Typography>
        {isUnlimited ? (
          <Typography>{amount}</Typography>
        ) : (
          <Typography data-testid="token-amount">
            {isErc20 ? formatAmountPrecise(amount, tokenInfo.decimals ?? 0) : `#${rawAmount.toString()}`}
          </Typography>
        )}
      </div>
    </div>
  )
}
