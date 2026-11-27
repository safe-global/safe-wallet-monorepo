import { useContext, type ReactElement } from 'react'
import type { Policy } from '@safe-global/views/features/spaces/components/Policies/types'
import { TxModalContext } from '@/components/tx-flow'
import type { ActiveAllowlistPolicy } from '../AllowlistDrawer/resolveState'
import { AllowlistDrawer } from '../AllowlistDrawer'
import { useAllowlistDetails } from './hooks/useAllowlistDetails'

export type AllowlistDetailsProps = {
  policy: ActiveAllowlistPolicy
  /** The Space's policies, to find the Safe's spending limits. */
  policies: Policy[]
  onClose: () => void
  justActivated?: boolean
}

/** Active allowlists only: pending ones are not wired to CGW yet. */
const AllowlistDetails = ({ policy, policies, onClose, justActivated }: AllowlistDetailsProps): ReactElement => {
  const content = useAllowlistDetails(policy, policies)
  const { txFlow } = useContext(TxModalContext)

  return (
    <AllowlistDrawer
      open={!txFlow}
      onClose={onClose}
      policy={policy}
      {...content}
      justActivated={justActivated}
      // TODO: placeholder handlers so the buttons look live; replace with the edit and remove flows
      onEdit={() => console.log('Edit allowlist', policy)}
      onRemove={() => console.log('Remove allowlist', policy)}
    />
  )
}

export default AllowlistDetails
