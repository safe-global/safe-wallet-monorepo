import type { MouseEvent, ReactElement, ReactNode } from 'react'
import { ADMIN_ONLY_RENAME_MESSAGE } from '@/utils/addressBookNotifications'
import { EllipsisVertical } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import EditIcon from '@/public/images/common/edit.svg'
import PlusIcon from '@/public/images/common/plus.svg'

type MenuItemHandler = (e: MouseEvent<HTMLElement, globalThis.MouseEvent>) => void

export type MultiAccountContextMenuViewProps = {
  canRename: boolean
  addNetwork: boolean
  onRename: MenuItemHandler
  onAddNetwork: MenuItemHandler
  renameDialog: ReactNode
  addChainDialog: ReactNode
}

export function MultiAccountContextMenuView({
  canRename,
  addNetwork,
  onRename,
  onAddNetwork,
  renameDialog,
  addChainDialog,
}: MultiAccountContextMenuViewProps): ReactElement {
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
          <Tooltip>
            <TooltipTrigger render={<div />}>
              <DropdownMenuItem
                disabled={!canRename}
                title={canRename ? undefined : ADMIN_ONLY_RENAME_MESSAGE}
                onClick={canRename ? onRename : undefined}
                onSelect={(e) => e.stopPropagation()}
              >
                <EditIcon className="text-foreground" />
                <span data-testid="rename-btn">Rename</span>
              </DropdownMenuItem>
            </TooltipTrigger>
            {!canRename && <TooltipContent>{ADMIN_ONLY_RENAME_MESSAGE}</TooltipContent>}
          </Tooltip>
          {addNetwork && (
            <DropdownMenuItem onClick={onAddNetwork}>
              <PlusIcon className="text-[var(--color-primary-main)]" />
              <span data-testid="add-chain-btn">Add another network</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {renameDialog}

      {addChainDialog}
    </>
  )
}
