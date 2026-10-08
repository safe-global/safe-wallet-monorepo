import type { NextPage } from 'next'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { BRAND_NAME } from '@/config/constants'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import { EarnPageView } from '@views/pages/EarnPageView'

const LazyEarnPage = dynamic(() => import('@/features/earn'), { ssr: false })

const EarnPage: NextPage = () => {
  const isFeatureEnabled = useHasFeature(FEATURES.EARN)

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Earn`}</title>
      </Head>

      <EarnPageView isFeatureEnabled={isFeatureEnabled} earnPage={<LazyEarnPage />} />
    </>
  )
}

export default EarnPage
