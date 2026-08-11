import { Separator } from '@/components/ui/separator'
import { FormProvider, useForm } from 'react-hook-form'
import css from './styles.module.css'
import type { ApprovalInfo } from './hooks/useApprovalInfos'

import { useMemo } from 'react'
import EditableApprovalItem from './EditableApprovalItem'
import groupBy from 'lodash/groupBy'
import { SpenderField } from './SpenderField'

export type ApprovalEditorFormData = {
  approvals: string[]
}

export const ApprovalEditorForm = ({
  approvalInfos,
  updateApprovals,
}: {
  approvalInfos: ApprovalInfo[]
  updateApprovals: (newApprovals: string[]) => void
}) => {
  const groupedApprovals = useMemo(() => groupBy(approvalInfos, (approval) => approval.spender), [approvalInfos])

  const initialApprovals = useMemo(() => approvalInfos.map((info) => info.amountFormatted), [approvalInfos])

  const formMethods = useForm<ApprovalEditorFormData>({
    defaultValues: {
      approvals: initialApprovals,
    },
    mode: 'onChange',
  })

  const { getValues, reset } = formMethods

  const onSave = () => {
    const formData = getValues('approvals')
    updateApprovals(formData)
    reset({ approvals: formData })
  }

  let fieldIndex = 0

  return (
    <FormProvider {...formMethods}>
      <ul className={css.approvalsList}>
        {Object.entries(groupedApprovals).map(([spender, approvals], spenderIdx) => (
          <div key={spender}>
            <div className="flex flex-col gap-4">
              {approvals.map((tx) => (
                <li
                  key={tx.tokenAddress + tx.spender}
                  className={`flex w-full ${0n === tx.amount ? css.zeroValueApproval : ''}`}
                  data-testid="approval-item"
                >
                  <EditableApprovalItem approval={tx} name={`approvals.${fieldIndex++}`} onSave={onSave} />
                </li>
              ))}
              <SpenderField address={spender} />

              {spenderIdx !== Object.keys(groupedApprovals).length - 1 && <Separator />}
            </div>
          </div>
        ))}
      </ul>
    </FormProvider>
  )
}
