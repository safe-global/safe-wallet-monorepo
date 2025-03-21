import type { NextPage } from 'next'
import Head from 'next/head'
import SpacesList from '@/features/spaces/components/SpacesList'
import { BRAND_NAME } from '@/config/constants'

const Spaces: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Spaces`}</title>
      </Head>

      <SpacesList />
    </>
  )
}

export default Spaces
