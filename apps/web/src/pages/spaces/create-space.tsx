import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import CreateSpaceOnboarding from '@/features/spaces/components/CreateSpaceOnboarding'
import { useAuthRedirect } from '@/features/spaces'

const CreateSpacePage: NextPage = () => {
  useAuthRedirect()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Create space`}</title>
      </Head>
      <CreateSpaceOnboarding />
    </>
  )
}

export default CreateSpacePage
