import { type SafeItem, type MultiChainSafeItem, isMultiChainSafeItem } from '@/hooks/safes'
import RemoveSafeDialog from './RemoveSafeDialog'
import { type MouseEvent, useState } from 'react'
import { LogOut, MoreVertical, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import EntryDialog from '@/components/address-book/EntryDialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'
import { useAddressBookWriteScope, useIsAdmin } from '@/features/spaces'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'

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
  const name = useSafeDisplayName(safeItem.address, chainIds[0])
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
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Safe Account actions"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            />
          }
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Tooltip>
            <TooltipTrigger render={<div />}>
              <DropdownMenuItem
                disabled={!canRename}
                onClick={canRename ? (e) => handleOpenModal(e, ModalType.RENAME) : undefined}
                onSelect={(e) => e.stopPropagation()}
              >
                <Pencil className="size-4 text-muted-foreground" />
                <span data-testid="rename-btn">Rename</span>
              </DropdownMenuItem>
            </TooltipTrigger>
            {!canRename && <TooltipContent>Only ADMINs can edit</TooltipContent>}
          </Tooltip>

          {isAdmin && (
            <DropdownMenuItem
              onClick={(e) => handleOpenModal(e, ModalType.REMOVE)}
              onSelect={(e) => e.stopPropagation()}
            >
              <LogOut className="size-4 text-muted-foreground" />
              <span>Remove from workspace</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {open[ModalType.RENAME] && (
        <EntryDialog
          handleClose={handleCloseModal}
          defaultValues={{ name: name || '', address: safeItem.address }}
          chainIds={chainIds}
          scope={scope}
          disableAddressInput
        />
      )}

      {open[ModalType.REMOVE] && <RemoveSafeDialog safeItem={safeItem} handleClose={handleCloseModal} />}
    </>
  )
}

export default SpaceSafeContextMenu
