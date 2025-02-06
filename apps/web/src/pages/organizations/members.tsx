import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'

const OrganizationDashboard: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Organization members`}</title>
      </Head>

      <main></main>
    </>
  )
}

export default OrganizationDashboard
