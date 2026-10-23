import { useContext, type ReactElement } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import type { ActiveAllowlistPolicy } from '@/features/spaces/components/Policies/AllowlistDrawer/resolveState'
import { AllowlistDrawer } from '../AllowlistDrawer'
import { useAllowlistDetails } from './hooks/useAllowlistDetails'

export type AllowlistDetailsProps = {
  policy: ActiveAllowlistPolicy
  onClose: () => void
}

/** Active allowlists only: pending ones are not wired to CGW yet. */
const AllowlistDetails = ({ policy, onClose }: AllowlistDetailsProps): ReactElement => {
  const content = useAllowlistDetails(policy)
  const { txFlow } = useContext(TxModalContext)

  return (
    <AllowlistDrawer
      open={!txFlow}
      onClose={onClose}
      policy={policy}
      {...content}
      // TODO: placeholder handlers so the buttons look live; replace with the edit and remove flows
      onEdit={() => console.log('Edit allowlist', policy)}
      onRemove={() => console.log('Remove allowlist', policy)}
    />
  )
}

export default AllowlistDetails
