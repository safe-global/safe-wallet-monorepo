import { CreateSafeOnNewChain } from '@/features/multichain'
import { useState } from 'react'
import { AddNetworkButtonView } from '@views/features/myAccounts/components/AddNetworkButton/AddNetworkButtonView'

export const AddNetworkButton = ({
  safeAddress,
  currentName,
  deployedChains,
}: {
  safeAddress: string
  currentName: string | undefined
  deployedChains: string[]
}) => {
  const [open, setOpen] = useState(false)

  return (
    <AddNetworkButtonView
      onOpen={() => setOpen(true)}
      dialog={
        open && (
          <CreateSafeOnNewChain
            open={open}
            onClose={() => setOpen(false)}
            currentName={currentName}
            safeAddress={safeAddress}
            deployedChainIds={deployedChains}
          />
        )
      }
    />
  )
}
