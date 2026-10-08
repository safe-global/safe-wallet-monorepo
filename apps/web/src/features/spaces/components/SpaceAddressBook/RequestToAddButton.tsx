import { useState } from 'react'
import EthHashInfo from '@/components/common/EthHashInfo'
import useChains from '@/hooks/useChains'
import { useAddOrRequestWorkspaceContact } from '../../hooks/useAddOrRequestWorkspaceContact'
import { validateContactName } from './utils'
import { RequestToAddButtonView } from '@views/features/spaces/components/SpaceAddressBook/RequestToAddButtonView'

type RequestToAddButtonProps = {
  address: string
  name: string
  chainIds: string[]
  alreadyRequested?: boolean
  isCompact?: boolean
}

const RequestToAddButton = ({ address, name, chainIds, alreadyRequested, isCompact }: RequestToAddButtonProps) => {
  const chains = useChains()
  const addOrRequestContact = useAddOrRequestWorkspaceContact()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requested, setRequested] = useState(false)
  const [open, setOpen] = useState(false)

  const isDone = alreadyRequested || requested
  const nameError = validateContactName(name)

  const handleConfirm = async () => {
    if (isDone) return

    setIsSubmitting(true)
    try {
      const result = await addOrRequestContact({ address, name, chainIds })
      if (result === 'requested' || result === 'pending') {
        setRequested(true)
        setOpen(false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <RequestToAddButtonView
      name={name}
      chainIds={chainIds}
      isCompact={isCompact}
      isDone={!!isDone}
      nameError={nameError}
      isSubmitting={isSubmitting}
      open={open}
      allChainsCount={chains.configs.length}
      addressSlot={
        <EthHashInfo address={address} shortAddress={false} showPrefix={false} showName={false} avatarSize={24} />
      }
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      onConfirm={handleConfirm}
    />
  )
}

export default RequestToAddButton
