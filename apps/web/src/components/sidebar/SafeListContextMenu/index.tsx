import type { MouseEvent } from 'react'
import { useRef, useState, type ReactElement } from 'react'
import { EllipsisVertical } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import EntryDialog from '@/components/address-book/EntryDialog'
import SafeListRemoveDialog from '@/components/sidebar/SafeListRemoveDialog'
import NestedSafesIcon from '@/public/images/sidebar/nested-safes-icon.svg'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import PlusIcon from '@/public/images/common/plus.svg'
import { trackEvent, OVERVIEW_EVENTS, OVERVIEW_LABELS, type AnalyticsEvent } from '@/services/analytics'
import useAddressBook from '@/hooks/useAddressBook'
import { AppRoutes } from '@/config/routes'
import router from 'next/router'
import { CreateSafeOnNewChain } from '@/features/multichain'
import { useOwnersGetSafesByOwnerV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import { NestedSafesPopover } from '../NestedSafesPopover'
import { NESTED_SAFE_EVENTS, NESTED_SAFE_LABELS } from '@/services/analytics/events/nested-safes'
import { useHasFeature } from '@/hooks/useChains'
import { useNestedSafesVisibility } from '@/hooks/useNestedSafesVisibility'

import { FEATURES } from '@safe-global/utils/utils/chains'

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
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              ref={triggerRef}
              variant="ghost"
              size="icon-sm"
              data-testid="safe-options-btn"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              className="text-[var(--color-border-main)]"
            />
          }
        >
          <EllipsisVertical />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          {isNestedSafesEnabled &&
            !hideNestedSafes &&
            !undeployedSafe &&
            nestedSafesForChain &&
            nestedSafesForChain.length > 0 && (
              <DropdownMenuItem
                onClick={handleOpenModal(ModalType.NESTED_SAFES, {
                  ...NESTED_SAFE_EVENTS.OPEN_LIST,
                  label: NESTED_SAFE_LABELS.sidebar,
                })}
              >
                <NestedSafesIcon className="text-[var(--color-success-main)]" />
                <span data-testid="nested-safes-btn">Nested Safes</span>
              </DropdownMenuItem>
            )}

          {rename && (
            <DropdownMenuItem onClick={handleOpenModal(ModalType.RENAME, OVERVIEW_EVENTS.SIDEBAR_RENAME)}>
              <EditIcon className="text-[var(--color-success-main)]" />
              <span data-testid="rename-btn">{hasName ? 'Rename' : 'Give name'}</span>
            </DropdownMenuItem>
          )}

          {undeployedSafe && (
            <DropdownMenuItem onClick={handleOpenModal(ModalType.REMOVE, OVERVIEW_EVENTS.REMOVE_FROM_WATCHLIST)}>
              <DeleteIcon className="text-[var(--color-error-main)]" />
              <span data-testid="remove-btn">Remove</span>
            </DropdownMenuItem>
          )}

          {addNetwork && (
            <DropdownMenuItem onClick={handleOpenModal(ModalType.ADD_CHAIN, OVERVIEW_EVENTS.ADD_NEW_NETWORK)}>
              <PlusIcon className="text-[var(--color-primary-main)]" />
              <span data-testid="add-chain-btn">Add another network</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {open[ModalType.NESTED_SAFES] && (
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
      )}

      {open[ModalType.RENAME] && (
        <EntryDialog
          handleClose={handleCloseModal}
          defaultValues={{ name, address }}
          chainIds={[chainId]}
          disableAddressInput
        />
      )}

      {open[ModalType.REMOVE] && (
        <SafeListRemoveDialog handleClose={handleCloseModal} address={address} chainId={chainId} />
      )}

      {open[ModalType.ADD_CHAIN] && (
        <CreateSafeOnNewChain
          onClose={handleCloseModal}
          currentName={name}
          deployedChainIds={[chainId]}
          open
          safeAddress={address}
        />
      )}
    </>
  )
}

export default SafeListContextMenu
