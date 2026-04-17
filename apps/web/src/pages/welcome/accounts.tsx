import type { NextPage } from 'next'
import Head from 'next/head'
import { useGetChainsConfigV2Query } from '@safe-global/store/gateway'
import { useLoadFeature } from '@/features/__core__'
import { MyAccountsFeature } from '@/features/myAccounts'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { BRAND_NAME, CONFIG_SERVICE_KEY } from '@/config/constants'
import { Spinner } from '@/components/ui/spinner'

const Accounts: NextPage = () => {
  const { MyAccounts, MyAccountsV2 } = useLoadFeature(MyAccountsFeature)
  const { isFetching } = useGetChainsConfigV2Query(CONFIG_SERVICE_KEY)
  const isRedesignEnabled = useHasFeature(FEATURES.WELCOME_ACCOUNTS_REDESIGN)

  const isFlagResolved = !isFetching && isRedesignEnabled !== undefined

  const renderAccounts = () => {
    if (!isFlagResolved) {
      return (
        <div className="flex w-full justify-center py-16">
          <Spinner className="text-muted-foreground size-6" />
        </div>
      )
    }
    return isRedesignEnabled ? <MyAccountsV2 /> : <MyAccounts />
  }

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – My accounts`}</title>
      </Head>

      {renderAccounts()}
    </>
  )
}

export default Accounts
