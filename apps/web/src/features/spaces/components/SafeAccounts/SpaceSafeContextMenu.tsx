import { type SafeItem, type MultiChainSafeItem, isMultiChainSafeItem } from '@/hooks/safes'
import { ADMIN_ONLY_RENAME_MESSAGE } from '@/utils/addressBookNotifications'
import RemoveSafeDialog from './RemoveSafeDialog'
import { type MouseEvent, useState } from 'react'
import EntryDialog from '@/components/address-book/EntryDialog'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'
import { useAddressBookWriteScope, useIsAdmin } from '@/features/spaces'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import { SpaceSafeContextMenuView } from '@views/features/spaces/components/SafeAccounts/SpaceSafeContextMenuView'

enum ModalType {
  RENAME = 'rename',
  REMOVE = 'remove',
}

const defaultOpen = { [ModalType.RENAME]: false, [ModalType.REMOVE]: false }

const SpaceSafeContextMenu = ({ safeItem }: { safeItem: SafeItem | MultiChainSafeItem }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  const isAdmin = useIsAdmin()

  const chainIds = isMultiChainSafeItem(safeItem) ? safeItem.safes.map((safe) => safe.chainId) : [safeItem.chainId]
  const name = useSafeDisplayName(safeItem.address, chainIds[0], safeItem.name)
  const { scope, canRename } = useAddressBookWriteScope(safeItem.address, chainIds)

  const handleOpenModal = (e: MouseEvent, type: keyof typeof open) => {
    e.stopPropagation()
    if (type === ModalType.REMOVE) trackEvent({ ...SPACE_EVENTS.DELETE_ACCOUNT_MODAL })
    setIsMenuOpen(false)
    setOpen((prev) => ({ ...prev, [type]: true }))
  }

  const handleCloseModal = () => {
    setOpen(defaultOpen)
  }

  return (
    <SpaceSafeContextMenuView
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      canRename={canRename}
      renameDisabledMessage={ADMIN_ONLY_RENAME_MESSAGE}
      isAdmin={isAdmin}
      onRename={(e) => handleOpenModal(e, ModalType.RENAME)}
      onRemove={(e) => handleOpenModal(e, ModalType.REMOVE)}
      dialogs={
        <>
          {open[ModalType.RENAME] && (
            <EntryDialog
              handleClose={handleCloseModal}
              defaultValues={{ name, address: safeItem.address }}
              chainIds={chainIds}
              scope={scope}
              disableAddressInput
            />
          )}

          {open[ModalType.REMOVE] && <RemoveSafeDialog safeItem={safeItem} handleClose={handleCloseModal} />}
        </>
      }
    />
  )
}

export default SpaceSafeContextMenu
