import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import css from './styles.module.css'
import Track from '@/components/common/Track'
import { MODALS_EVENTS } from '@/services/analytics/events/modals'
import { SquarePen } from 'lucide-react'
import TokenIcon from '@/components/common/TokenIcon'

export type EditableApprovalItemViewProps = {
  logoUri?: string
  tokenSymbol?: string
  readOnly: boolean
  onEditMode: () => void
  onSave: () => void
  isSaveDisabled: boolean
  valueField: ReactNode
}

export const EditableApprovalItemView = ({
  logoUri,
  tokenSymbol,
  readOnly,
  onEditMode,
  onSave,
  isSaveDisabled,
  valueField,
}: EditableApprovalItemViewProps) => {
  return (
    <div className={`${css.approvalField} ${css.approvalRow}`} onClick={readOnly ? onEditMode : undefined}>
      <div className={css.approvalIcon}>
        <TokenIcon size={32} logoUri={logoUri} tokenSymbol={tokenSymbol} />
      </div>

      {valueField}

      <div className={css.approvalAction}>
        <Track {...MODALS_EVENTS.EDIT_APPROVALS} label={readOnly ? 'edit' : 'save'}>
          {readOnly ? (
            <Button variant="ghost" size="icon-sm" onClick={onEditMode} title="Edit">
              <SquarePen className="size-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onSave} title="Save" disabled={isSaveDisabled}>
              Save
            </Button>
          )}
        </Track>
      </div>
    </div>
  )
}
