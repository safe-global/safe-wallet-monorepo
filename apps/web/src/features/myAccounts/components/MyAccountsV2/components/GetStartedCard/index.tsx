import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { useNewSafeNextParam } from '@/components/new-safe/getReturnUrl'
import { useDarkMode } from '@/hooks/useDarkMode'
import { GetStartedCardView } from '@views/features/myAccounts/components/MyAccountsV2/components/GetStartedCard/GetStartedCardView'

/**
 * Signed-out empty state on the welcome "Trusted accounts" tab: invites the
 * user to connect a wallet (create flow) or watch an existing Safe account.
 */
const GetStartedCard = () => {
  const isDarkMode = useDarkMode()
  const connectWallet = useConnectWallet()
  const next = useNewSafeNextParam()

  return <GetStartedCardView isDarkMode={isDarkMode} onConnectWallet={connectWallet} next={next} />
}

export default GetStartedCard
