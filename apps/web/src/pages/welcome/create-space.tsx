import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import CreateSpaceOnboarding from '@/features/spaces/public/components/CreateSpaceOnboarding'

const CreateSpacePage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Create Workspace`}</title>
      </Head>
      <CreateSpaceOnboarding />
    </>
  )
}

export default CreateSpacePage
