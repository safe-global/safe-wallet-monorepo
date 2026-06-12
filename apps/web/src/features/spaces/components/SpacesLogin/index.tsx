import Head from 'next/head'
import { SpacesFeature } from '../../SpacesFeature'
import { useLoadFeature } from '@/features/__core__'
import { BRAND_NAME } from '@/config/constants'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useFeatureFlagRedirect from '../../hooks/useFeatureFlagRedirect'

const SpacesLogin = () => {
  const isSpacesFeatureEnabled = useHasFeature(FEATURES.SPACES)
  const spaces = useLoadFeature(SpacesFeature)
  useFeatureFlagRedirect()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Workspaces`}</title>
      </Head>

      {isSpacesFeatureEnabled && <spaces.SpacesList />}
    </>
  )
}

export default SpacesLogin
