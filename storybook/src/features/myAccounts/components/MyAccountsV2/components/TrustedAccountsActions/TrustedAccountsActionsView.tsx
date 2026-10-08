import type { ReactNode } from 'react'
import { Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

export type TrustedAccountsActionsViewProps = {
  isDarkMode: boolean
  onManage: () => void
  renderAddAccountsChooser: (props: { className: string }) => ReactNode
}

export const TrustedAccountsActionsView = ({
  isDarkMode,
  onManage,
  renderAddAccountsChooser,
}: TrustedAccountsActionsViewProps) => {
  return (
    <div className={cn('shadcn-scope flex flex-wrap gap-2', isDarkMode && 'dark')}>
      {renderAddAccountsChooser({ className: 'hover:bg-muted' })}

      <Button variant="outline" onClick={onManage} className="hover:bg-muted" data-testid="add-more-safes-button">
        <Settings2 className="size-4" />
        Manage list
      </Button>
    </div>
  )
}
