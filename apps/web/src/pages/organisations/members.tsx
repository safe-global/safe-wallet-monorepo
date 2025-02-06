import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'

const OrganisationDashboard: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Organisation Members`}</title>
      </Head>

      <main></main>
    </>
  )
}

export default OrganisationDashboard
