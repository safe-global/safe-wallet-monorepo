import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { removeAddressBookEntry } from '@/store/addressBookSlice'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'

type RemoveDuplicateButtonProps = {
  address: string
  chainIds: string[]
}

const RemoveDuplicateButton = ({ address, chainIds }: RemoveDuplicateButtonProps) => {
  const dispatch = useAppDispatch()
  const [removed, setRemoved] = useState(false)

  const handleRemove = () => {
    if (removed) return

    for (const chainId of chainIds) {
      dispatch(removeAddressBookEntry({ chainId, address }))
    }

    setRemoved(true)
    dispatch(
      showNotification({ message: 'Duplicate contact removed', variant: 'success', groupKey: 'remove-dup-success' }),
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRemove} disabled={removed}>
      {removed ? 'Removed' : 'Remove'}
    </Button>
  )
}

export default RemoveDuplicateButton
