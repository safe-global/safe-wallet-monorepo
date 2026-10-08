import type { ReactNode } from 'react'
import css from './styles.module.css'

export type ApprovalsViewGroup = {
  spender: string
  spenderField: ReactNode
  items: Array<{ key: string; isZeroValue: boolean; content?: ReactNode }>
}

export type ApprovalsViewProps = {
  groups: ApprovalsViewGroup[]
}

export const ApprovalsView = ({ groups }: ApprovalsViewProps) => {
  return (
    <ul className={css.approvalsList}>
      {groups.map(({ spender, spenderField, items }) => (
        <div key={spender} className="flex flex-col gap-4">
          {spenderField}
          {items.map((item) => {
            if (!item.content) return <></>

            return (
              <li
                key={item.key}
                className={`flex w-full ${item.isZeroValue ? css.zeroValueApproval : ''}`}
                data-testid="approval-item"
              >
                {item.content}
              </li>
            )
          })}
        </div>
      ))}
    </ul>
  )
}
