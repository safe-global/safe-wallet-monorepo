import type { ApprovalInfo } from './hooks/useApprovalInfos'

import { ApprovalValueField } from './ApprovalValueField'
import { useFormContext } from 'react-hook-form'
import get from 'lodash/get'
import { useState } from 'react'
import { EditableApprovalItemView } from '@views/components/tx/ApprovalEditor/EditableApprovalItemView'

const EditableApprovalItem = ({
  approval,
  name,
  onSave,
}: {
  approval: ApprovalInfo
  onSave: () => void
  name: string
}) => {
  const { formState, setFocus } = useFormContext()

  const { errors, dirtyFields } = formState

  const fieldErrors = get(errors, name)
  const isDirty = get(dirtyFields, name)

  const [readOnly, setReadOnly] = useState(true)

  const handleSave = () => {
    onSave()
    setReadOnly(true)
  }

  const handleEditMode = () => {
    setReadOnly(false)
    // We need to rerender such that select on focus triggers
    setTimeout(() => setFocus(name), 0)
  }

  return (
    <EditableApprovalItemView
      logoUri={approval.tokenInfo?.logoUri}
      tokenSymbol={approval.tokenInfo?.symbol}
      readOnly={readOnly}
      onEditMode={handleEditMode}
      onSave={handleSave}
      isSaveDisabled={!!fieldErrors || !isDirty}
      valueField={<ApprovalValueField name={name} tx={approval} readOnly={readOnly} />}
    />
  )
}

export default EditableApprovalItem
