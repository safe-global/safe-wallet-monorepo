import type { NextPage } from 'next'
import Head from 'next/head'
import MyAccounts from '@/features/myAccounts'
import { BRAND_NAME } from '@/config/constants'

const Accounts: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – My accounts`}</title>
      </Head>

      <MyAccounts />
    </>
  )
}

export default Accounts
