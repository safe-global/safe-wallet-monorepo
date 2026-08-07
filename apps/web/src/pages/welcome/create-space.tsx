import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'

const CreateSpacePage: NextPage = () => {
  const { CreateSpaceOnboarding } = useLoadFeature(SpacesFeature)
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Create workspace`}</title>
      </Head>
      <CreateSpaceOnboarding />
    </>
  )
}

export default CreateSpacePage
