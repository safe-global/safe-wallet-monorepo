import { useState } from 'react'
import ProposerDrawer from '../ProposerDrawer'
import RemoveProposerModal from '../RemoveProposerModal'
import { useProposerDetails } from './hooks/useProposerDetails'
import type { Proposer, ProposerPolicy } from '../types'

export type ProposerDetailsProps = {
  policy: ProposerPolicy
  proposer: Proposer
  onClose: () => void
}

const ProposerDetails = ({ policy, proposer, onClose }: ProposerDetailsProps) => {
  const [isRemoveOpen, setIsRemoveOpen] = useState(false)
  const drawer = useProposerDetails({ policy, proposer, onRemove: () => setIsRemoveOpen(true) })

  return (
    <>
      <ProposerDrawer open onClose={onClose} {...drawer} />

      <RemoveProposerModal
        open={isRemoveOpen}
        onClose={() => setIsRemoveOpen(false)}
        onConfirm={() => {
          // TODO(WA-3142): sign and delete the delegate.
        }}
      />
    </>
  )
}

export default ProposerDetails
