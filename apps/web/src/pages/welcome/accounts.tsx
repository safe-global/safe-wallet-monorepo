import type { NextPage } from 'next'
import Head from 'next/head'
import { useGetChainsConfigV2Query } from '@safe-global/store/gateway'
import { useLoadFeature } from '@/features/__core__'
import { MyAccountsFeature } from '@/features/myAccounts'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { BRAND_NAME, CONFIG_SERVICE_KEY } from '@/config/constants'
import { AccountsView } from '@views/pages/welcome/AccountsView'

const Accounts: NextPage = () => {
  const { MyAccounts, MyAccountsV2 } = useLoadFeature(MyAccountsFeature)
  const { isLoading } = useGetChainsConfigV2Query(CONFIG_SERVICE_KEY)
  const isRedesignEnabled = useHasFeature(FEATURES.WELCOME_ACCOUNTS_REDESIGN)

  const isFlagResolved = !isLoading && isRedesignEnabled !== undefined

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – My accounts`}</title>
      </Head>

      <AccountsView isLoading={!isFlagResolved}>{isRedesignEnabled ? <MyAccountsV2 /> : <MyAccounts />}</AccountsView>
    </>
  )
}

export default Accounts
