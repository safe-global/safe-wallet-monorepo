import type { NextPage } from 'next'
import Head from 'next/head'
import SpacesList from '@/features/spaces/components/SpacesList'
import { BRAND_NAME } from '@/config/constants'
import useFeatureFlagRedirect from '@/features/spaces/hooks/useFeatureFlagRedirect'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

const Spaces: NextPage = () => {
  const isSpacesFeatureEnabled = useHasFeature(FEATURES.SPACES)
  useFeatureFlagRedirect()

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
