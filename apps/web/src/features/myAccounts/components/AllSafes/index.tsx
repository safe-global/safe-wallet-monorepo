import ConnectWalletButton from '@/components/common/ConnectWallet/ConnectWalletButton'
import Track from '@/components/common/Track'
import { AppRoutes } from '@/config/routes'
import SafesList from '../SafesList'
import type { AllSafeItems } from '@/hooks/safes'
import css from '../../styles.module.css'
import useWallet from '@/hooks/wallets/useWallet'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import { ChevronDownIcon } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Typography } from '@/components/ui/typography'
import { useRouter } from 'next/router'

const AllSafes = ({
  allSafes,
  onLinkClick,
  isSidebar,
}: {
  allSafes: AllSafeItems
  onLinkClick?: () => void
  isSidebar: boolean
}) => {
  const wallet = useWallet()
  const router = useRouter()

  const isLoginPage = router.pathname === AppRoutes.welcome.accounts
  const trackingLabel = isLoginPage ? OVERVIEW_LABELS.login_page : OVERVIEW_LABELS.sidebar

  return (
    <Collapsible defaultOpen={!isSidebar}>
      <CollapsibleTrigger
        render={
          <button
            type="button"
            data-testid="expand-safes-list"
            className="group/all-safes flex w-full cursor-pointer items-center gap-1 text-left"
          />
        }
      >
        <div className={css.listHeader}>
          <Typography variant="h4">
            Accounts
            {allSafes && allSafes.length > 0 && (
              <Typography variant="paragraph-small" color="muted" className="mr-2 font-normal">
                {' '}
                ({allSafes.length})
              </Typography>
            )}
          </Typography>
        </div>
        <ChevronDownIcon className="text-muted-foreground ml-auto size-5 transition-transform group-aria-expanded/all-safes:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent data-testid="accounts-list">
        {allSafes.length > 0 ? (
          <div className="mt-2">
            <SafesList safes={allSafes} onLinkClick={onLinkClick} />
          </div>
        ) : (
          <Typography
            data-testid="empty-account-list"
            variant="paragraph-small"
            color="muted"
            align="center"
            className="mx-auto block w-[250px] py-6"
          >
            {!wallet ? (
              <>
                <span className="mb-4 block">Connect a wallet to view your Safe Accounts or to create a new one</span>
                <Track {...OVERVIEW_EVENTS.OPEN_ONBOARD} label={trackingLabel}>
                  <ConnectWalletButton text="Connect a wallet" contained />
                </Track>
              </>
            ) : (
              "You don't have any safes yet"
            )}
          </Typography>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

export default AllSafes
