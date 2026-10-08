import type { ReactNode } from 'react'
import { Separator } from '@/components/ui/separator'
import css from './styles.module.css'

export type ApprovalEditorFormViewGroup = {
  spender: string
  spenderField: ReactNode
  items: Array<{ key: string; isZeroValue: boolean; content: ReactNode }>
}

export type ApprovalEditorFormViewProps = {
  groups: ApprovalEditorFormViewGroup[]
}

export const ApprovalEditorFormView = ({ groups }: ApprovalEditorFormViewProps) => {
  return (
    <ul className={css.approvalsList}>
      {groups.map(({ spender, spenderField, items }, spenderIdx) => (
        <div key={spender}>
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <li
                key={item.key}
                className={`flex w-full ${item.isZeroValue ? css.zeroValueApproval : ''}`}
                data-testid="approval-item"
              >
                {item.content}
              </li>
            ))}
            {spenderField}

            {spenderIdx !== groups.length - 1 && <Separator />}
          </div>
        </div>
      ))}
    </ul>
  )
}
