import type { ReactElement, ReactNode } from 'react'
import { Ellipsis } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export type TransferActionsViewProps = {
  menuOpen: boolean
  onMenuOpenChange: (open: boolean) => void
  canSendAgain: boolean
  renderCheckWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
  onSendAgain: () => void
  onAddToAddressBook: () => void
  entryDialog?: ReactNode
}

export const TransferActionsView = ({
  menuOpen,
  onMenuOpenChange,
  canSendAgain,
  renderCheckWallet,
  onSendAgain,
  onAddToAddressBook,
  entryDialog,
}: TransferActionsViewProps): ReactElement => {
  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
        <DropdownMenuTrigger
          data-testid="transfer-actions-btn"
          render={<Button variant="ghost" size="icon-sm" className="ml-1 text-[var(--color-border-main)]" />}
        >
          <Ellipsis />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canSendAgain &&
            renderCheckWallet((isOk) => (
              <DropdownMenuItem onClick={onSendAgain} disabled={!isOk}>
                Send again
              </DropdownMenuItem>
            ))}

          <DropdownMenuItem data-testid="add-to-address-book-btn" onClick={onAddToAddressBook}>
            Add to address book
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {entryDialog}
    </>
  )
}
