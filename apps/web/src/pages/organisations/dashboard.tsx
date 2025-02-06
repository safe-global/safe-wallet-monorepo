import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import OrganisationsDashboard from '@/features/organisations/components/Dashboard'

const OrganisationDashboard: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Organisation Dashboard`}</title>
      </Head>

      <main>
        <OrganisationsDashboard />
      </main>
    </>
  )
}

export default OrganisationDashboard
