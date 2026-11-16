import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'

const CreateSpacePage = () => {
  const { CreateSpaceOnboarding } = useLoadFeature(SpacesFeature)
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
