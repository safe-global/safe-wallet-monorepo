import Head from 'next/head'
import SpacesList from '../components/SpacesList'
import { BRAND_NAME } from '@/config/constants'

const SpacesLogin = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Workspaces`}</title>
      </Head>

      <SpacesList />
    </>
  )
}

export default SpacesLogin
