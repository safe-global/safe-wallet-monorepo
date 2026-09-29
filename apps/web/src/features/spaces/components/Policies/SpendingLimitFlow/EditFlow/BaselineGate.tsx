import type { ReactElement } from 'react'
import { WalletCards } from 'lucide-react'
import TxCard from '@/components/tx-flow/common/TxCard'
import TxLayoutBase from '@/components/tx-flow/common/TxLayoutBase'
import { Skeleton } from '@/components/ui/skeleton'
import type { SpendingLimitState } from '@/features/spending-limits'
import LoadError from '../../components/LoadError'
import { EDIT_STEP_TITLE, FLOW_SUBTITLE } from '../constants'

export const BASELINE_LOAD_ERROR =
  "The Safe account's current spending limits could not be read, so this policy cannot be edited right now."

export type BaselineGateProps = {
  /** Undefined until the chain has answered. */
  limits?: SpendingLimitState[]
  error?: Error
  children: (limits: SpendingLimitState[]) => ReactElement
}

const SpendingLimitIcon = (): ReactElement => <WalletCards aria-hidden />

/**
 * `TxFlow` is not mounted yet, so the wait wears the same chrome it will. The Safe Shield rail is left
 * out rather than stubbed: its provider belongs to `TxFlow`, and there is no transaction to screen yet.
 */
const Chrome = ({ children }: { children: ReactElement }): ReactElement => (
  <TxLayoutBase
    title={EDIT_STEP_TITLE}
    subtitle={FLOW_SUBTITLE}
    icon={SpendingLimitIcon}
    hideNonce
    hideSafeShield
    hideStatusRail
    step={0}
    stepCount={2}
    progress={0}
  >
    <TxCard>{children}</TxCard>
  </TxLayoutBase>
)

/** The form's own field shapes, so the wait does not redraw the page when it ends. */
const FormSkeleton = (): ReactElement => (
  <div className="flex flex-col gap-5" data-testid="baseline-loading" aria-busy aria-live="polite">
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>

    <div className="flex flex-col gap-4 rounded-xl bg-muted-secondary p-4">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-12 flex-1 rounded-lg" />
        <Skeleton className="h-12 flex-1 rounded-lg" />
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  </div>
)

/**
 * The edit form describes a change to what the chain holds, so it stays out of reach until that is
 * known: a form filled in over a failed read would produce a delta against nothing.
 */
const BaselineGate = ({ limits, error, children }: BaselineGateProps): ReactElement => {
  if (error) {
    return (
      <Chrome>
        <LoadError message={BASELINE_LOAD_ERROR} data-testid="baseline-load-error" />
      </Chrome>
    )
  }

  if (!limits) {
    return (
      <Chrome>
        <FormSkeleton />
      </Chrome>
    )
  }

  return children(limits)
}

export default BaselineGate
