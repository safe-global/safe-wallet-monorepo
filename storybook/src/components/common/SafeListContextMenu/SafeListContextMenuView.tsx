import type { MouseEvent, ReactElement, ReactNode, RefObject } from 'react'
import { ADMIN_ONLY_RENAME_MESSAGE } from '@/utils/addressBookNotifications'
import { EllipsisVertical } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import NestedSafesIcon from '@/public/images/sidebar/nested-safes-icon.svg'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import PlusIcon from '@/public/images/common/plus.svg'

type MenuItemHandler = (e: MouseEvent<HTMLElement, globalThis.MouseEvent>) => void

export type SafeListContextMenuViewProps = {
  triggerRef: RefObject<HTMLButtonElement | null>
  menuOpen: boolean
  onMenuOpenChange: (open: boolean) => void
  showNestedSafes: boolean
  rename: boolean
  canRename: boolean
  hasName: boolean
  undeployedSafe: boolean
  addNetwork: boolean
  onNestedSafes: MenuItemHandler
  onRename: MenuItemHandler
  onRemove: MenuItemHandler
  onAddNetwork: MenuItemHandler
  nestedSafesPopover: ReactNode
  renameDialogOpen: boolean
  /** Renders the EntryDialog container, on the given layer */
  renderRenameDialog: (layer: { className: string; overlayClassName: string }) => ReactNode
  removeDialog: ReactNode
  addChainDialog: ReactNode
}

export function SafeListContextMenuView({
  triggerRef,
  menuOpen,
  onMenuOpenChange,
  showNestedSafes,
  rename,
  canRename,
  hasName,
  undeployedSafe,
  addNetwork,
  onNestedSafes,
  onRename,
  onRemove,
  onAddNetwork,
  nestedSafesPopover,
  renameDialogOpen,
  renderRenameDialog,
  removeDialog,
  addChainDialog,
}: SafeListContextMenuViewProps): ReactElement {
  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
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
              className="text-muted-foreground"
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
          {showNestedSafes && (
            <DropdownMenuItem onClick={onNestedSafes}>
              <NestedSafesIcon className="text-[var(--color-success-main)]" />
              <span data-testid="nested-safes-btn">Nested Safes</span>
            </DropdownMenuItem>
          )}

          {rename && (
            <Tooltip>
              <TooltipTrigger render={<div />}>
                <DropdownMenuItem
                  disabled={!canRename}
                  title={canRename ? undefined : ADMIN_ONLY_RENAME_MESSAGE}
                  onClick={canRename ? onRename : undefined}
                  onSelect={(e) => e.stopPropagation()}
                >
                  <EditIcon className="text-foreground" />
                  <span data-testid="rename-btn">{hasName ? 'Rename' : 'Give name'}</span>
                </DropdownMenuItem>
              </TooltipTrigger>
              {!canRename && <TooltipContent>{ADMIN_ONLY_RENAME_MESSAGE}</TooltipContent>}
            </Tooltip>
          )}

          {undeployedSafe && (
            <DropdownMenuItem onClick={onRemove}>
              <DeleteIcon className="text-[var(--color-error-main)]" />
              <span data-testid="remove-btn">Remove</span>
            </DropdownMenuItem>
          )}

          {addNetwork && (
            <DropdownMenuItem onClick={onAddNetwork}>
              <PlusIcon className="text-[var(--color-primary-main)]" />
              <span data-testid="add-chain-btn">Add another network</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {nestedSafesPopover}

      {renameDialogOpen &&
        renderRenameDialog({
          // Above shadcn's overlay layer (--z-overlay) so Rename shows over the Trusted Safes modal
          className: 'z-[var(--z-nested-overlay)]',
          overlayClassName: 'z-[var(--z-nested-overlay)]',
        })}

      {removeDialog}

      {addChainDialog}
    </>
  )
}
