import { useCallback, useState } from 'react'
import ProposerDrawer from '../ProposerDrawer'
import RemoveProposerModal from '../RemoveProposerModal'
import { useProposerDetails } from './hooks/useProposerDetails'
import { useRemoveProposer } from './hooks/useRemoveProposer'
import type { Proposer, ProposerPolicy } from '../types'

export type ProposerDetailsProps = {
  policy: ProposerPolicy
  proposer: Proposer
  onClose: () => void
}

const ProposerDetails = ({ policy, proposer, onClose }: ProposerDetailsProps) => {
  const [isRemoveOpen, setIsRemoveOpen] = useState(false)
  const drawer = useProposerDetails({ policy, proposer, onRemove: () => setIsRemoveOpen(true) })

  // The removed proposer leaves the table, so the drawer describing it closes too.
  const onRemoved = useCallback(() => {
    setIsRemoveOpen(false)
    onClose()
  }, [onClose])

  const { removeProposer, isRemoving, error, resetError } = useRemoveProposer({ policy, proposer }, onRemoved)

  const closeRemove = () => {
    setIsRemoveOpen(false)
    resetError()
  }

  return (
    <>
      <ProposerDrawer open onClose={onClose} {...drawer} />

      <RemoveProposerModal
        open={isRemoveOpen}
        onClose={closeRemove}
        onConfirm={removeProposer}
        isRemoving={isRemoving}
        error={error?.message}
      />
    </>
  )
}

export default ProposerDetails
