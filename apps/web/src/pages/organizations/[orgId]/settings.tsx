import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'

const OrgSettings: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Organization settings`}</title>
      </Head>

      <main>Org settings</main>
    </>
  )
}

export default OrgSettings
