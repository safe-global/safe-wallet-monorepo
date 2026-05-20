import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useGetChainsConfigV2Query } from '@safe-global/store/gateway'
import { useLoadFeature } from '@/features/__core__'
import { MyAccountsFeature } from '@/features/myAccounts'
import { useHasFeature, useHasDefaultChainFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { AppRoutes } from '@/config/routes'
import { BRAND_NAME, CONFIG_SERVICE_KEY } from '@/config/constants'
import { Spinner } from '@/components/ui/spinner'

const Accounts: NextPage = () => {
  const router = useRouter()
  const { MyAccounts, MyAccountsV2 } = useLoadFeature(MyAccountsFeature)
  const { isLoading } = useGetChainsConfigV2Query(CONFIG_SERVICE_KEY)
  const isRedesignEnabled = useHasFeature(FEATURES.WELCOME_ACCOUNTS_REDESIGN)
  // Default landing is /welcome/spaces while the new flow is on (DISABLE_SPACES_LOGIN unset),
  // so /welcome/accounts redirects there. Only stay here in legacy mode.
  const isLegacyMode = useHasDefaultChainFeature(FEATURES.DISABLE_SPACES_LOGIN) === true

  useEffect(() => {
    if (!isLegacyMode) {
      router.replace(AppRoutes.welcome.spaces)
    }
  }, [isLegacyMode, router])

  const isFlagResolved = !isLoading && isRedesignEnabled !== undefined

  const renderAccounts = () => {
    if (!isFlagResolved || !isLegacyMode) {
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
