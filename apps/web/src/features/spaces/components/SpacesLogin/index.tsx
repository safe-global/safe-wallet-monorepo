import Head from 'next/head'
import { SpacesFeature } from '../../SpacesFeature'
import { useLoadFeature } from '@/features/__core__'
import { BRAND_NAME } from '@/config/constants'

const SpacesLogin = () => {
  const spaces = useLoadFeature(SpacesFeature)

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Workspaces`}</title>
      </Head>

      <spaces.SpacesList />
    </>
  )
}

export default SpacesLogin
