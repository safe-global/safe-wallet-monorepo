import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import type { NextPage } from 'next'

const OrganizationDashboard: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Organization members`}</title>
      </Head>

      <main>Members</main>
    </>
  )
}

export default OrganizationDashboard
