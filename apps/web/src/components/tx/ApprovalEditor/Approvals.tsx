import { type ApprovalInfo } from '@/components/tx/ApprovalEditor/hooks/useApprovalInfos'
import css from './styles.module.css'
import ApprovalItem from '@/components/tx/ApprovalEditor/ApprovalItem'
import groupBy from 'lodash/groupBy'
import { useMemo } from 'react'
import { SpenderField } from './SpenderField'

const Approvals = ({ approvalInfos }: { approvalInfos: ApprovalInfo[] }) => {
  const groupedApprovals = useMemo(() => groupBy(approvalInfos, (approval) => approval.spender), [approvalInfos])

  return (
    <ul className={css.approvalsList}>
      {Object.entries(groupedApprovals).map(([spender, approvals]) => (
        <div key={spender} className="flex flex-col gap-4">
          <SpenderField address={spender} />
          {approvals.map((tx) => {
            if (!tx.tokenInfo) return <></>

            return (
              <li
                key={tx.tokenAddress + tx.spender}
                className={`flex w-full ${BigInt(0) === BigInt(tx.amount) ? css.zeroValueApproval : ''}`}
                data-testid="approval-item"
              >
                <ApprovalItem
                  spender={tx.spender}
                  method={tx.method}
                  amount={tx.amountFormatted}
                  rawAmount={tx.amount}
                  tokenInfo={tx.tokenInfo}
                />
              </li>
            )
          })}
        </div>
      ))}
    </ul>
  )
}

export default Approvals
