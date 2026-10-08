import { type ApprovalInfo } from '@/components/tx/ApprovalEditor/hooks/useApprovalInfos'
import ApprovalItem from '@/components/tx/ApprovalEditor/ApprovalItem'
import groupBy from 'lodash/groupBy'
import { useMemo } from 'react'
import { SpenderField } from './SpenderField'
import { ApprovalsView } from '@views/components/tx/ApprovalEditor/ApprovalsView'

const Approvals = ({ approvalInfos }: { approvalInfos: ApprovalInfo[] }) => {
  const groupedApprovals = useMemo(() => groupBy(approvalInfos, (approval) => approval.spender), [approvalInfos])

  const groups = Object.entries(groupedApprovals).map(([spender, approvals]) => ({
    spender,
    spenderField: <SpenderField address={spender} />,
    items: approvals.map((tx) => ({
      key: tx.tokenAddress + tx.spender,
      isZeroValue: !!tx.tokenInfo && BigInt(0) === BigInt(tx.amount),
      content: tx.tokenInfo ? (
        <ApprovalItem
          spender={tx.spender}
          method={tx.method}
          amount={tx.amountFormatted}
          rawAmount={tx.amount}
          tokenInfo={tx.tokenInfo}
        />
      ) : undefined,
    })),
  }))

  return <ApprovalsView groups={groups} />
}

export default Approvals
