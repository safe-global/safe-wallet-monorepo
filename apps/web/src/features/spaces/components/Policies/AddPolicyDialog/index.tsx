import { type ReactElement } from 'react'
import { MixpanelEventParams, trackEvent } from '@/services/analytics'
import { ADD_POLICY_DISMISSED_LABEL, POLICY_EVENTS } from '@/services/analytics/events/policies'
import {
  ADD_POLICY_OPTIONS,
  type AddPolicyId,
  type AddPolicyOption,
} from '@views/features/spaces/components/Policies/AddPolicyDialog/options'
import { AddPolicyDialogView } from '@views/features/spaces/components/Policies/AddPolicyDialog/AddPolicyDialogView'

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

  return <AddPolicyDialogView open={open} onOpenChange={handleOpenChange} onSelect={handleSelect} options={options} />
}

export default AddPolicyDialog
