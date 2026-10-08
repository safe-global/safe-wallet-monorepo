import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import SettingsIcon from '@/public/images/sidebar/settings.svg'

export type ManageTokensButtonViewProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  menu: ReactNode
}

export const ManageTokensButtonView = ({ open, onOpenChange, menu }: ManageTokensButtonViewProps): ReactElement => {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" data-testid="manage-tokens-button">
            <SettingsIcon className="size-4 sm:mr-2" />
            <span className="hidden sm:inline">Manage tokens</span>
          </Button>
        }
      />
      {menu}
    </DropdownMenu>
  )
}
