import { useRouter } from 'next/router'
import { trackEvent } from '@/services/analytics'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import {
  AccountsNavigationView,
  accountsNavItems,
  type AccountsNavItem,
} from '@views/features/myAccounts/components/AccountsNavigation/AccountsNavigationView'

const AccountsNavigation = () => {
  const router = useRouter()
  const isSafePro = useIsSafeProEnabled()

  const activeUrl = accountsNavItems.some((item) => item.url === router.pathname)
    ? router.pathname
    : accountsNavItems[0].url

  const handleClick = (item: AccountsNavItem) => () => {
    if (item.trackEvent && router.pathname !== item.url) {
      trackEvent(item.trackEvent)
    }
  }

  return <AccountsNavigationView activeUrl={activeUrl} isSafePro={isSafePro} getClickHandler={handleClick} />
}

export default AccountsNavigation
