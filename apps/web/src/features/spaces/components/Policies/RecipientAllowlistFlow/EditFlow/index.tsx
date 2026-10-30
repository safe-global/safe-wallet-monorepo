import { useState, type ReactElement } from 'react'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import TxLayoutBase from '@/components/tx-flow/common/TxLayoutBase'
import TxCard from '@safe-global/views/components/tx-flow/common/TxCard'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { TxFlowType } from '@/services/analytics'
import LoadError from '@safe-global/views/features/spaces/components/Policies/components/LoadError'
import { EditModeProvider } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/EditFlow/EditModeContext'
import { EDIT_STEP_TITLE } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import {
  FLOW_SUBTITLE,
  TOKENS_LOAD_ERROR_TEXT,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import RecipientAllowlistIcon from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/RecipientAllowlistIcon'
import type { ActiveAllowlistPolicy } from '../../AllowlistDrawer/resolveState'
import ReviewRecipientAllowlist from '../ReviewStep'
import useHeldTokenAddresses from '../hooks/useHeldTokenAddresses'
import { useRecipientAllowlistSteps } from '../hooks/useRecipientAllowlistSteps'
import { toAllowlistEditValues } from '../utils/allowlistEdit'
import type { RecipientAllowlistFlowData } from '../types'

/** `TxFlow` is not mounted yet, so the wait wears its chrome. */
const Chrome = ({ children }: { children: ReactElement }): ReactElement => (
  <TxLayoutBase
    title={EDIT_STEP_TITLE}
    subtitle={FLOW_SUBTITLE}
    icon={RecipientAllowlistIcon}
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

const FormSkeleton = (): ReactElement => (
  <div className="flex flex-col gap-5" data-testid="allowlist-edit-loading" aria-busy aria-live="polite">
    <Skeleton className="h-16 w-full rounded-lg" />
    <Skeleton className="h-12 w-full rounded-lg" />
    <Skeleton className="h-32 w-full rounded-xl" />
    <Skeleton className="h-32 w-full rounded-xl" />
  </div>
)

const EditTxFlow = ({ initialData }: { initialData: RecipientAllowlistFlowData }): ReactElement => {
  const steps = useRecipientAllowlistSteps(EDIT_STEP_TITLE)

  return (
    <TxFlow<RecipientAllowlistFlowData>
      icon={RecipientAllowlistIcon}
      subtitle={FLOW_SUBTITLE}
      ReviewTransactionComponent={ReviewRecipientAllowlist}
      eventCategory={TxFlowType.EDIT_SPACE_RECIPIENT_ALLOWLIST}
      initialData={initialData}
    >
      {steps}
    </TxFlow>
  )
}

/** The form is seeded once from the held tokens, since `TxFlow` reads `initialData` only at mount. */
const EditFlowBody = ({ policy }: { policy: ActiveAllowlistPolicy }): ReactElement => {
  const scope = useSafeScope()
  const heldTokens = useHeldTokenAddresses()
  const [initialData, setInitialData] = useState<RecipientAllowlistFlowData>()
  const isError = heldTokens.isError || Boolean(scope?.safeError)
  const isReady = Boolean(scope?.safeLoaded) && !heldTokens.isLoading && !isError

  if (!initialData && isReady) {
    const { entries } = policy.data
    setInitialData({ ...toAllowlistEditValues(entries, heldTokens.addresses), rules: [], baseline: entries })
  }

  if (initialData) return <EditTxFlow initialData={initialData} />

  return (
    <Chrome>
      {isError ? (
        <LoadError message={TOKENS_LOAD_ERROR_TEXT} onRetry={heldTokens.refetch} data-testid="allowlist-edit-error" />
      ) : (
        <FormSkeleton />
      )}
    </Chrome>
  )
}

const EditRecipientAllowlistFlow = ({ policy }: { policy: ActiveAllowlistPolicy }): ReactElement => (
  <SafeScopeProvider initial={{ chainId: policy.safe.chainId, safeAddress: policy.safe.address }}>
    <EditModeProvider>
      <EditFlowBody policy={policy} />
    </EditModeProvider>
  </SafeScopeProvider>
)

export default EditRecipientAllowlistFlow
