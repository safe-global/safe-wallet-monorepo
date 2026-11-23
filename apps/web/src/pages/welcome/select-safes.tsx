import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import WorkspaceOnboardingStep from '@/features/spaces/public/components/WorkspaceOnboardingStep'

const SelectSafesPage = () => {
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
