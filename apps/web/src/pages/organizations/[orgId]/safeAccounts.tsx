import OrganizationSafeAccounts from '@/features/organizations/components/SafeAccounts'
import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'

const SafeAccounts: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Organization Safe Accounts`}</title>
      </Head>

      <main>
        <OrganizationSafeAccounts />
      </main>
    </>
  )
}

export default SafeAccounts
