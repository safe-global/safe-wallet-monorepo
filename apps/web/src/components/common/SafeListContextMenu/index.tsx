import type { MouseEvent } from 'react'
import { useRef, useState, type ReactElement } from 'react'

import EntryDialog from '@/components/address-book/EntryDialog'
import { useAddressBookWriteScope } from '@/features/spaces'
import SafeListRemoveDialog from '@/components/common/SafeListRemoveDialog'
import { trackEvent, OVERVIEW_EVENTS, OVERVIEW_LABELS, type AnalyticsEvent } from '@/services/analytics'
import useAddressBook from '@/hooks/useAddressBook'
import { AppRoutes } from '@/config/routes'
import router from 'next/router'
import { CreateSafeOnNewChain } from '@/features/multichain'
import { useOwnersGetSafesByOwnerV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import { NestedSafesPopover } from '@/components/nested-safes/NestedSafesPopover'
import { NESTED_SAFE_EVENTS, NESTED_SAFE_LABELS } from '@/services/analytics/events/nested-safes'
import { useHasFeature } from '@/hooks/useChains'
import { useNestedSafesVisibility } from '@/hooks/useNestedSafesVisibility'

import { FEATURES } from '@safe-global/utils/utils/chains'
import { SafeListContextMenuView } from '@views/components/common/SafeListContextMenu/SafeListContextMenuView'

enum ModalType {
  NESTED_SAFES = 'nested_safes',
  RENAME = 'rename',
  REMOVE = 'remove',
  ADD_CHAIN = 'add_chain',
}

const defaultOpen = {
  [ModalType.NESTED_SAFES]: false,
  [ModalType.RENAME]: false,
  [ModalType.REMOVE]: false,
  [ModalType.ADD_CHAIN]: false,
}

const SafeListContextMenu = ({
  name,
  address,
  chainId,
  addNetwork,
  rename,
  undeployedSafe,
  hideNestedSafes = false,
  onClose,
}: {
  name: string
  address: string
  chainId: string
  addNetwork: boolean
  rename: boolean
  undeployedSafe: boolean
  hideNestedSafes?: boolean
  onClose?: () => void
}): ReactElement => {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  const isNestedSafesEnabled = useHasFeature(FEATURES.NESTED_SAFES)
  const { currentData: ownedSafes } = useOwnersGetSafesByOwnerV1Query(
    { chainId, ownerAddress: address },
    {
      skip: !isNestedSafesEnabled || hideNestedSafes || !address || (!menuOpen && !open[ModalType.NESTED_SAFES]),
    },
  )
  const addressBook = useAddressBook()
  const hasName = address in addressBook
  const { scope, canRename } = useAddressBookWriteScope(address, [chainId])

  const nestedSafesForChain = ownedSafes?.safes ?? []
  const { allSafesWithStatus, visibleSafes, hasCompletedCuration, isLoading, startFiltering } =
    useNestedSafesVisibility(nestedSafesForChain, chainId)

  const trackingLabel =
    router.pathname === AppRoutes.welcome.accounts ? OVERVIEW_LABELS.login_page : OVERVIEW_LABELS.sidebar

  const handleOpenModal =
    (type: keyof typeof open, event: AnalyticsEvent) => (e: MouseEvent<HTMLElement, globalThis.MouseEvent>) => {
      e.stopPropagation()
      e.preventDefault()
      if (type === ModalType.NESTED_SAFES) {
        startFiltering()
      }
      setOpen((prev) => ({ ...prev, [type]: true }))

      trackEvent({ ...event, label: trackingLabel })
    }

  const handleCloseModal = () => {
    setOpen(defaultOpen)
  }

  return (
    <SafeListContextMenuView
      triggerRef={triggerRef}
      menuOpen={menuOpen}
      onMenuOpenChange={setMenuOpen}
      showNestedSafes={Boolean(
        isNestedSafesEnabled &&
        !hideNestedSafes &&
        !undeployedSafe &&
        nestedSafesForChain &&
        nestedSafesForChain.length > 0,
      )}
      rename={rename}
      canRename={canRename}
      hasName={hasName}
      undeployedSafe={undeployedSafe}
      addNetwork={addNetwork}
      onNestedSafes={handleOpenModal(ModalType.NESTED_SAFES, {
        ...NESTED_SAFE_EVENTS.OPEN_LIST,
        label: NESTED_SAFE_LABELS.sidebar,
      })}
      onRename={handleOpenModal(ModalType.RENAME, OVERVIEW_EVENTS.SIDEBAR_RENAME)}
      onRemove={handleOpenModal(ModalType.REMOVE, OVERVIEW_EVENTS.REMOVE_FROM_WATCHLIST)}
      onAddNetwork={handleOpenModal(ModalType.ADD_CHAIN, OVERVIEW_EVENTS.ADD_NEW_NETWORK)}
      nestedSafesPopover={
        open[ModalType.NESTED_SAFES] && (
          <NestedSafesPopover
            anchorEl={triggerRef.current}
            onClose={() => {
              handleCloseModal()
              onClose?.()
            }}
            rawNestedSafes={nestedSafesForChain}
            allSafesWithStatus={allSafesWithStatus}
            visibleSafes={visibleSafes}
            hasCompletedCuration={hasCompletedCuration}
            isLoading={isLoading}
            hideCreationButton
          />
        )
      }
      renameDialogOpen={open[ModalType.RENAME]}
      renderRenameDialog={(layer) => (
        <EntryDialog
          handleClose={handleCloseModal}
          defaultValues={{ name, address }}
          chainIds={[chainId]}
          scope={scope}
          disableAddressInput
          {...layer}
        />
      )}
      removeDialog={
        open[ModalType.REMOVE] && (
          <SafeListRemoveDialog handleClose={handleCloseModal} address={address} chainId={chainId} />
        )
      }
      addChainDialog={
        open[ModalType.ADD_CHAIN] && (
          <CreateSafeOnNewChain
            onClose={handleCloseModal}
            currentName={name}
            deployedChainIds={[chainId]}
            open
            safeAddress={address}
          />
        )
      }
    />
  )
}

export default SafeListContextMenu
