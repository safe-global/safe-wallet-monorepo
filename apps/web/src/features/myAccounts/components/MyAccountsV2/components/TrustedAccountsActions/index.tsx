import { Settings2 } from 'lucide-react'
import AddAccountsChooser from '@/components/common/AddAccountsChooser'
import { Button } from '@/components/ui/button'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'

/**
 * Action buttons on the trusted-accounts panel: open the "Add accounts" chooser
 * (watch existing / create new) and manage the trusted list. Sits top-right
 * inside the panel per the redesign.
 */
const TrustedAccountsActions = ({ onManage, onLinkClick }: { onManage: () => void; onLinkClick?: () => void }) => {
  const isDarkMode = useDarkMode()

  return (
    <div className={cn('shadcn-scope flex flex-wrap gap-2', isDarkMode && 'dark')}>
      <AddAccountsChooser onLinkClick={onLinkClick} />

      <Button variant="outline" onClick={onManage} data-testid="add-more-safes-button">
        <Settings2 className="size-4" />
        Manage list
      </Button>
    </div>
  )
}

export default TrustedAccountsActions
