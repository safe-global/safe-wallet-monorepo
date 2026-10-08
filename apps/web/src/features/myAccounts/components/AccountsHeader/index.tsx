import ConnectWalletButton from '@/components/common/ConnectWallet/ConnectWalletButton'
import { AppRoutes } from '@/config/routes'
import AccountsNavigation from '../AccountsNavigation'
import CreateButton from '../CreateButton'
import { useHasFeature } from '@/hooks/useChains'
import { useDarkMode } from '@/hooks/useDarkMode'
import useWallet from '@/hooks/wallets/useWallet'
import { OVERVIEW_LABELS } from '@/services/analytics'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useRouter } from 'next/router'
import { useNewSafeNextParam } from '@/components/new-safe/getReturnUrl'
import {
  AccountsHeaderView,
  AddSafeButtonView,
} from '@views/features/myAccounts/components/AccountsHeader/AccountsHeaderView'

const AddSafeButton = ({ trackingLabel, onLinkClick }: { trackingLabel: string; onLinkClick?: () => void }) => {
  const next = useNewSafeNextParam()
  return (
    <AddSafeButtonView
      trackingLabel={trackingLabel}
      href={{ pathname: AppRoutes.newSafe.load, query: { next } }}
      onLinkClick={onLinkClick}
    />
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
    <AccountsHeaderView
      isSidebar={isSidebar}
      isDarkMode={isDarkMode}
      showTitle={isSidebar || !isSpacesFeatureEnabled}
      trackingLabel={trackingLabel}
      hasWallet={!!wallet}
      accountsNavigation={<AccountsNavigation />}
      addSafeButton={<AddSafeButton trackingLabel={trackingLabel} onLinkClick={onLinkClick} />}
      createButton={<CreateButton isPrimary />}
      renderConnectWalletButton={(props) => <ConnectWalletButton {...props} />}
    />
  )
}

export default AccountsHeader
