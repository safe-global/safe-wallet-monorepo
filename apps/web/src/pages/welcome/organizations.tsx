import type { NextPage } from 'next'
import Head from 'next/head'
import OrgsList from '@/features/organizations/components/OrgsList'
import { BRAND_NAME } from '@/config/constants'

const Organizations: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Organizations`}</title>
      </Head>

      <OrgsList />
    </>
  )
}

export default Organizations
