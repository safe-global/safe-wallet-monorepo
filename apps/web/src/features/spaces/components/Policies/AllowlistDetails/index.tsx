import { useContext, type ReactElement } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import type { ActiveAllowlistPolicy } from '@/features/spaces/components/Policies/AllowlistDrawer/resolveState'
import { AllowlistDrawer } from '../AllowlistDrawer'
import { useAllowlistDetails } from './hooks/useAllowlistDetails'

export type AllowlistDetailsProps = {
  policy: ActiveAllowlistPolicy
  onClose: () => void
}

/** Active allowlists only: pending ones are not wired to CGW yet. Edit and Remove stay disabled until their flows exist. */
const AllowlistDetails = ({ policy, onClose }: AllowlistDetailsProps): ReactElement => {
  const content = useAllowlistDetails(policy)
  const { txFlow } = useContext(TxModalContext)

  return <AllowlistDrawer open={!txFlow} onClose={onClose} policy={policy} {...content} />
}

export default AllowlistDetails
