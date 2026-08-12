import { Button } from '@/components/ui/button'
import css from '@/components/tx/ApprovalEditor/styles.module.css'
import type { ApprovalInfo } from './hooks/useApprovalInfos'

import { ApprovalValueField } from './ApprovalValueField'
import Track from '@/components/common/Track'
import { MODALS_EVENTS } from '@/services/analytics'
import { useFormContext } from 'react-hook-form'
import get from 'lodash/get'
import { SquarePen } from 'lucide-react'
import TokenIcon from '@/components/common/TokenIcon'
import { useState } from 'react'

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
    <div
      className={`${css.approvalField} flex flex-row items-center gap-4`}
      onClick={readOnly ? handleEditMode : undefined}
    >
      <div className="flex flex-row items-center gap-1">
        <TokenIcon size={32} logoUri={approval.tokenInfo?.logoUri} tokenSymbol={approval.tokenInfo?.symbol} />
      </div>

      <ApprovalValueField name={name} tx={approval} readOnly={readOnly} />

      <Track {...MODALS_EVENTS.EDIT_APPROVALS} label={readOnly ? 'edit' : 'save'}>
        {readOnly ? (
          <Button variant="ghost" size="icon-sm" onClick={handleEditMode} title="Edit">
            <SquarePen className="size-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={handleSave} title="Save" disabled={!!fieldErrors || !isDirty}>
            Save
          </Button>
        )}
      </Track>
    </div>
  )
}

export default EditableApprovalItem
