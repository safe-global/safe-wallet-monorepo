import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import WorkspaceOnboardingStep from '@/features/spaces/public/components/WorkspaceOnboardingStep'

const CreateSpacePage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Create Workspace`}</title>
      </Head>
      <WorkspaceOnboardingStep step="name" />
    </>
  )
}

export default CreateSpacePage
