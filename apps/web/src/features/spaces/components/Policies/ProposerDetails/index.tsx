import ProposerDrawer from '../ProposerDrawer'
import { useProposerDetails } from './hooks/useProposerDetails'
import type { Proposer, ProposerPolicy } from '../types'

export type ProposerDetailsProps = {
  policy: ProposerPolicy
  proposer: Proposer
  onClose: () => void
}

const ProposerDetails = ({ policy, proposer, onClose }: ProposerDetailsProps) => {
  const drawer = useProposerDetails({ policy, proposer })

  return <ProposerDrawer open onClose={onClose} {...drawer} />
}

export default ProposerDetails
