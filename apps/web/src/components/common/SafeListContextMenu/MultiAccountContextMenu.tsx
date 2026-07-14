import type { MouseEvent } from 'react'
import { useState, type ReactElement } from 'react'
import { EllipsisVertical } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import EntryDialog from '@/components/address-book/EntryDialog'
import EditIcon from '@/public/images/common/edit.svg'
import PlusIcon from '@/public/images/common/plus.svg'
import { trackEvent, OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import { AppRoutes } from '@/config/routes'
import router from 'next/router'
import { CreateSafeOnNewChain } from '@/features/multichain'

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

  const handleOpenModal =
    (type: ModalType, event: typeof OVERVIEW_EVENTS.SIDEBAR_RENAME | typeof OVERVIEW_EVENTS.ADD_NEW_NETWORK) =>
    (e: MouseEvent<HTMLElement, globalThis.MouseEvent>) => {
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              data-testid="safe-options-btn"
              onClick={(e) => e.stopPropagation()}
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
          <DropdownMenuItem onClick={handleOpenModal(ModalType.RENAME, OVERVIEW_EVENTS.SIDEBAR_RENAME)}>
            <EditIcon className="text-[var(--color-success-main)]" />
            <span data-testid="rename-btn">Rename</span>
          </DropdownMenuItem>
          {addNetwork && (
            <DropdownMenuItem onClick={handleOpenModal(ModalType.ADD_CHAIN, OVERVIEW_EVENTS.ADD_NEW_NETWORK)}>
              <PlusIcon className="text-[var(--color-primary-main)]" />
              <span data-testid="add-chain-btn">Add another network</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {open[ModalType.RENAME] && (
        <EntryDialog
          handleClose={handleCloseModal}
          defaultValues={{ name, address }}
          chainIds={chainIds}
          disableAddressInput
        />
      )}

      {open[ModalType.ADD_CHAIN] && (
        <CreateSafeOnNewChain
          onClose={handleCloseModal}
          currentName={name}
          deployedChainIds={chainIds}
          open
          safeAddress={address}
        />
      )}
    </>
  )
}

export default MultiAccountContextMenu
