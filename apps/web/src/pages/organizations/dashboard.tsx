import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import OrganizationsDashboard from '@/features/organizations/components/Dashboard'

const OrganizationDashboard: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Organization dashboard`}</title>
      </Head>

      <main>
        <OrganizationsDashboard />
      </main>
    </>
  )
}

export default OrganizationDashboard
