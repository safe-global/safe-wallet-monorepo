import type { NextPage } from 'next'
import Head from 'next/head'
import { SpacesFeature, useFeatureFlagRedirect } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'
import { BRAND_NAME } from '@/config/constants'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

const Spaces: NextPage = () => {
  const isSpacesFeatureEnabled = useHasFeature(FEATURES.SPACES)
  const spaces = useLoadFeature(SpacesFeature)
  useFeatureFlagRedirect()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Spaces`}</title>
      </Head>

      {isSpacesFeatureEnabled && <spaces.SpacesList />}
    </>
  )
}

export default Spaces
