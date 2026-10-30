import { useContext, type ReactElement } from 'react'
import type { Policy } from '@safe-global/views/features/spaces/components/Policies/types'
import { TxModalContext } from '@/components/tx-flow'
import type { ActiveAllowlistPolicy } from '../AllowlistDrawer/resolveState'
import { AllowlistDrawer } from '../AllowlistDrawer'
import RemoveAllowlistFlow from '../RemoveAllowlistFlow'
import RemoveGuardFlow from '../RemoveGuardFlow'
import EditRecipientAllowlistFlow from '../RecipientAllowlistFlow/EditFlow'
import { toAllowlistRules } from '../RecipientAllowlistFlow/utils/allowlistEdit'
import { useAllowlistDetails } from './hooks/useAllowlistDetails'

export type AllowlistDetailsProps = {
  policy: ActiveAllowlistPolicy
  /** The Space's policies, to find the Safe's spending limits. */
  policies: Policy[]
  onClose: () => void
  justActivated?: boolean
  /** Set once the guard's delay is over: opens the apply flow. */
  onApply?: () => void
}

/** Active allowlists only: pending ones are not wired to CGW yet. */
const AllowlistDetails = ({
  policy,
  policies,
  onClose,
  justActivated,
  onApply,
}: AllowlistDetailsProps): ReactElement => {
  const content = useAllowlistDetails(policy, policies)
  const { txFlow, setTxFlow } = useContext(TxModalContext)
  const { chainId, address: safeAddress } = policy.safe
  const { enforcement } = policy

  const onRemove =
    enforcement.via === 'guard'
      ? () =>
          setTxFlow(
            <RemoveAllowlistFlow
              chainId={chainId}
              safeAddress={safeAddress}
              guardAddress={enforcement.guardAddress}
              rules={toAllowlistRules(policy.data.entries)}
            />,
          )
      : undefined

  return (
    <AllowlistDrawer
      open={!txFlow}
      onClose={onClose}
      policy={policy}
      {...content}
      justActivated={justActivated}
      onApply={onApply}
      onEdit={() => setTxFlow(<EditRecipientAllowlistFlow policy={policy} />)}
      onRemove={onRemove}
      onRemoveGuard={() => setTxFlow(<RemoveGuardFlow chainId={chainId} safeAddress={safeAddress} />)}
    />
  )
}

export default AllowlistDetails
