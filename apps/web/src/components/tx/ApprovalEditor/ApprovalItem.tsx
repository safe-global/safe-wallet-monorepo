import type { Approval } from '@safe-global/utils/services/security/modules/ApprovalModule'
import { TokenType } from '@safe-global/store/gateway/types'
import type { ApprovalInfo } from './hooks/useApprovalInfos'
import { PSEUDO_APPROVAL_VALUES } from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { ApprovalItemView } from '@views/components/tx/ApprovalEditor/ApprovalItemView'

export { approvalMethodDescription } from '@views/components/tx/ApprovalEditor/ApprovalItemView'

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
    <ApprovalItemView
      method={method}
      amount={amount}
      rawAmount={rawAmount}
      tokenInfo={tokenInfo}
      isUnlimited={amount === PSEUDO_APPROVAL_VALUES.UNLIMITED}
      isErc20={tokenInfo.type === TokenType.ERC20}
    />
  )
}

export default ApprovalItem
