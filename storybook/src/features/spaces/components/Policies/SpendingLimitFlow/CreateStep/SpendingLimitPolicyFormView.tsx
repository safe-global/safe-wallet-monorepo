import type { FormEventHandler, ReactElement, ReactNode } from 'react'
import { Plus } from 'lucide-react'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import { Button } from '@/components/ui/button'
import type { RemovalCopy } from '@/features/spaces/components/Policies/SpendingLimitFlow/utils/removals'
import PendingRemovalsCard from '../EditFlow/PendingRemovalsCard'
import SpenderCallout from './SpenderCallout'
import { ADD_SPENDER_LABEL, NEXT_LABEL } from '../constants'

export type SpendingLimitPolicyFormViewProps = {
  onSubmit: FormEventHandler<HTMLFormElement>
  isEditMode: boolean
  isCalloutDismissed: boolean
  onDismissCallout: () => void
  safeAccountField: ReactNode
  removalCopy?: RemovalCopy
  onDiscardChanges: () => void
  spenderCards: ReactNode
  onAddSpender: () => void
  isNextDisabled: boolean
}

export const SpendingLimitPolicyFormView = ({
  onSubmit,
  isEditMode,
  isCalloutDismissed,
  onDismissCallout,
  safeAccountField,
  removalCopy,
  onDiscardChanges,
  spenderCards,
  onAddSpender,
  isNextDisabled,
}: SpendingLimitPolicyFormViewProps): ReactElement => (
  <TxCard>
    <form onSubmit={onSubmit} className="flex flex-col gap-5" data-testid="spending-limit-policy-form">
      {!isEditMode && <SpenderCallout dismissed={isCalloutDismissed} onDismiss={onDismissCallout} />}

      {safeAccountField}

      {removalCopy && <PendingRemovalsCard copy={removalCopy} onDiscard={onDiscardChanges} />}

      {spenderCards}

      <div>
        <Button type="button" variant="secondary" onClick={onAddSpender} data-testid="add-spender-btn">
          <Plus />
          {ADD_SPENDER_LABEL}
        </Button>
      </div>

      <TxCardActions>
        <Button type="submit" size="submit" disabled={isNextDisabled} data-testid="next-btn">
          {NEXT_LABEL}
        </Button>
      </TxCardActions>
    </form>
  </TxCard>
)
