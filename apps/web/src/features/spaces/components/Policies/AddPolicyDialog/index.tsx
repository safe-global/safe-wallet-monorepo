import { type ReactElement } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MixpanelEventParams, trackEvent } from '@/services/analytics'
import { ADD_POLICY_DISMISSED_LABEL, POLICY_EVENTS } from '@/services/analytics/events/policies'
import { cn } from '@/utils/cn'
import AddPolicyOptionButton from './AddPolicyOptionButton'
import { ADD_POLICY_OPTIONS, type AddPolicyId, type AddPolicyOption } from './options'

const SINGLE_COLUMN_MAX = 3

export interface AddPolicyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect?: (id: AddPolicyId) => void
  options?: AddPolicyOption[]
}

const AddPolicyDialog = ({
  open,
  onOpenChange,
  onSelect,
  options = ADD_POLICY_OPTIONS,
}: AddPolicyDialogProps): ReactElement => {
  const isTwoColumn = options.length > SINGLE_COLUMN_MAX

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      trackEvent(
        { ...POLICY_EVENTS.ADD_POLICY_DIALOG_CLOSED, label: ADD_POLICY_DISMISSED_LABEL },
        { [MixpanelEventParams.RESULT]: ADD_POLICY_DISMISSED_LABEL },
      )
    }
    onOpenChange(nextOpen)
  }

  const handleSelect = (id: AddPolicyId) => {
    trackEvent(
      { ...POLICY_EVENTS.ADD_POLICY_DIALOG_CLOSED, label: id },
      { [MixpanelEventParams.RESULT]: 'selected', [MixpanelEventParams.POLICY_TYPE]: id },
    )
    onSelect?.(id)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size={isTwoColumn ? 'sm' : 'xs'} data-testid="add-policy-dialog">
        <DialogHeader>
          <DialogTitle className="text-xl leading-6 font-semibold">Add policy</DialogTitle>
        </DialogHeader>

        <div
          data-testid="add-policy-options"
          className={cn('grid gap-3 px-4 pb-4', {
            'sm:grid-cols-2': isTwoColumn,
          })}
        >
          {options.map((option) => (
            <AddPolicyOptionButton key={option.id} {...option} onClick={() => handleSelect(option.id)} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddPolicyDialog
