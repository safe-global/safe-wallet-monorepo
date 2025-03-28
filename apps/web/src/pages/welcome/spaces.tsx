import type { NextPage } from 'next'
import Head from 'next/head'
import SpacesList from '@/features/spaces/components/SpacesList'
import { BRAND_NAME } from '@/config/constants'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@/utils/chains'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { useEffect } from 'react'

const Spaces: NextPage = () => {
  const router = useRouter()
  const isSpacesFeatureEnabled = useHasFeature(FEATURES.SPACES)

  useEffect(() => {
    if (!isSpacesFeatureEnabled) {
      router.push({ pathname: AppRoutes.welcome.accounts })
    }
  }, [isSpacesFeatureEnabled, router])

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Spaces`}</title>
      </Head>

      {isSpacesFeatureEnabled && <SpacesList />}
    </>
  )
}

export default Spaces
