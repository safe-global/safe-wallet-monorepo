import { FormProvider, useForm } from 'react-hook-form'
import type { ApprovalInfo } from './hooks/useApprovalInfos'

import { useMemo } from 'react'
import EditableApprovalItem from './EditableApprovalItem'
import groupBy from 'lodash/groupBy'
import { SpenderField } from './SpenderField'
import { ApprovalEditorFormView } from '@views/components/tx/ApprovalEditor/ApprovalEditorFormView'

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

  const groups = Object.entries(groupedApprovals).map(([spender, approvals]) => ({
    spender,
    spenderField: <SpenderField address={spender} />,
    items: approvals.map((tx) => ({
      key: tx.tokenAddress + tx.spender,
      isZeroValue: 0n === tx.amount,
      content: <EditableApprovalItem approval={tx} name={`approvals.${fieldIndex++}`} onSave={onSave} />,
    })),
  }))

  return (
    <FormProvider {...formMethods}>
      <ApprovalEditorFormView groups={groups} />
    </FormProvider>
  )
}
