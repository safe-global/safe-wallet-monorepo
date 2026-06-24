import ConnectWalletButton from '@/components/common/ConnectWallet/ConnectWalletButton'
import Track from '@/components/common/Track'
import { AppRoutes } from '@/config/routes'
import AccountsNavigation from '../AccountsNavigation'
import CreateButton from '../CreateButton'
import { useHasFeature } from '@/hooks/useChains'
import { useDarkMode } from '@/hooks/useDarkMode'
import useWallet from '@/hooks/wallets/useWallet'
import AddIcon from '@/public/images/common/add.svg'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { useNewSafeNextParam } from '@/components/new-safe/getReturnUrl'

const AddSafeButton = ({ trackingLabel, onLinkClick }: { trackingLabel: string; onLinkClick?: () => void }) => {
  const next = useNewSafeNextParam()
  return (
    <Track {...OVERVIEW_EVENTS.ADD_TO_WATCHLIST} label={trackingLabel}>
      <Button
        data-testid="add-safe-button"
        variant="outline"
        size="lg"
        onClick={onLinkClick}
        className="w-full rounded-lg h-full px-5 text-base "
        render={<NextLink href={{ pathname: AppRoutes.newSafe.load, query: { next } }} />}
      >
        <AddIcon color="currentColor" className="size-5 fill-primary" />
        Add
      </Button>
    </Track>
  )
}

const AccountsHeader = ({ isSidebar, onLinkClick }: { isSidebar: boolean; onLinkClick?: () => void }) => {
  const wallet = useWallet()
  const router = useRouter()
  const isDarkMode = useDarkMode()
  const isSpacesFeatureEnabled = useHasFeature(FEATURES.SPACES)
  const isLoginPage = router.pathname === AppRoutes.welcome.accounts
  const trackingLabel = isLoginPage ? OVERVIEW_LABELS.login_page : OVERVIEW_LABELS.sidebar

  return (
    <div
      className={cn(
        'shadcn-scope flex justify-between gap-4 py-6 max-[599px]:flex-col',
        isDarkMode && 'dark',
        isSidebar && 'border-border border-b px-4',
      )}
    >
      {isSidebar || !isSpacesFeatureEnabled ? (
        <Typography variant={isSidebar ? 'h3' : 'h1'}>Accounts</Typography>
      ) : (
        <AccountsNavigation />
      )}

      <div className="flex flex-row gap-2 max-[599px]:[&>span]:flex-1">
        <AddSafeButton trackingLabel={trackingLabel} onLinkClick={onLinkClick} />

        {wallet ? (
          <Track {...OVERVIEW_EVENTS.CREATE_NEW_SAFE} label={trackingLabel}>
            <CreateButton isPrimary className="h-full text-base" />
          </Track>
        ) : (
          <ConnectWalletButton small={true} className="h-full rounded-lg text-base" />
        )}
      </div>
    </div>
  )
}

export default AccountsHeader
