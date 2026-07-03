import NextLink from 'next/link'
import Track from '@/components/common/Track'
import { AppRoutes } from '@/config/routes'
import { useNewSafeNextParam } from '@/components/new-safe/getReturnUrl'
import AddIcon from '@/public/images/common/add.svg'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import { Button } from '@/components/ui/button'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'

/**
 * Action buttons on the trusted-accounts panel: add (watch) a Safe account and
 * manage the trusted list. Sits top-right inside the panel per the redesign.
 */
const TrustedAccountsActions = ({ onManage, onLinkClick }: { onManage: () => void; onLinkClick?: () => void }) => {
  const isDarkMode = useDarkMode()
  const next = useNewSafeNextParam()

  return (
    <div className={cn('shadcn-scope flex flex-wrap justify-end gap-2 px-4 pt-4', isDarkMode && 'dark')}>
      <Track {...OVERVIEW_EVENTS.ADD_TO_WATCHLIST} label={OVERVIEW_LABELS.login_page}>
        <Button
          data-testid="add-safe-button"
          variant="outline"
          onClick={onLinkClick}
          render={<NextLink href={{ pathname: AppRoutes.newSafe.load, query: { next } }} />}
        >
          <AddIcon color="currentColor" className="size-4 fill-current" />
          Add
        </Button>
      </Track>

      <Button variant="outline" onClick={onManage} data-testid="add-more-safes-button">
        Manage trusted Safe accounts
      </Button>
    </div>
  )
}

export default TrustedAccountsActions
