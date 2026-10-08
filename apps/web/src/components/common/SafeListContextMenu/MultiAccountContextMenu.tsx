import type { MouseEvent } from 'react'
import { useState, type ReactElement } from 'react'

import EntryDialog from '@/components/address-book/EntryDialog'
import { useAddressBookWriteScope } from '@/features/spaces'
import { trackEvent, OVERVIEW_EVENTS, OVERVIEW_LABELS, type AnalyticsEvent } from '@/services/analytics'
import { AppRoutes } from '@/config/routes'
import router from 'next/router'
import { CreateSafeOnNewChain } from '@/features/multichain'
import { MultiAccountContextMenuView } from '@views/components/common/SafeListContextMenu/MultiAccountContextMenuView'

enum ModalType {
  RENAME = 'rename',
  ADD_CHAIN = 'add_chain',
}

const defaultOpen = { [ModalType.RENAME]: false, [ModalType.ADD_CHAIN]: false }

const MultiAccountContextMenu = ({
  name,
  address,
  chainIds,
  addNetwork,
}: {
  name: string
  address: string
  chainIds: string[]
  addNetwork: boolean
}): ReactElement => {
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  const { scope, canRename } = useAddressBookWriteScope(address, chainIds)

  const handleOpenModal =
    (type: ModalType, event: AnalyticsEvent) => (e: MouseEvent<HTMLElement, globalThis.MouseEvent>) => {
      e.stopPropagation()
      const trackingLabel =
        router.pathname === AppRoutes.welcome.accounts ? OVERVIEW_LABELS.login_page : OVERVIEW_LABELS.sidebar
      setOpen((prev) => ({ ...prev, [type]: true }))

      trackEvent({ ...event, label: trackingLabel })
    }

  const handleCloseModal = () => {
    setOpen(defaultOpen)
  }

  return (
    <MultiAccountContextMenuView
      canRename={canRename}
      addNetwork={addNetwork}
      onRename={handleOpenModal(ModalType.RENAME, OVERVIEW_EVENTS.SIDEBAR_RENAME)}
      onAddNetwork={handleOpenModal(ModalType.ADD_CHAIN, OVERVIEW_EVENTS.ADD_NEW_NETWORK)}
      renameDialog={
        open[ModalType.RENAME] && (
          <EntryDialog
            handleClose={handleCloseModal}
            defaultValues={{ name, address }}
            chainIds={chainIds}
            scope={scope}
            disableAddressInput
          />
        )
      }
      addChainDialog={
        open[ModalType.ADD_CHAIN] && (
          <CreateSafeOnNewChain
            onClose={handleCloseModal}
            currentName={name}
            deployedChainIds={chainIds}
            open
            safeAddress={address}
          />
        )
      }
    />
  )
}

export default MultiAccountContextMenu
