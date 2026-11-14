import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'

const SelectSafesPage = () => {
  const { WorkspaceOnboardingStep } = useLoadFeature(SpacesFeature)
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Select Safe accounts`}</title>
      </Head>

      <WorkspaceOnboardingStep step="safes" />
    </>
  )
}

export default SelectSafesPage
