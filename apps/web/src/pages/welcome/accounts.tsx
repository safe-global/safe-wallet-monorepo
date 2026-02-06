import type { NextPage } from 'next'
import Head from 'next/head'
import { useLoadFeature } from '@/features/__core__'
import { MyAccountsFeature } from '@/features/myAccounts'
import { BRAND_NAME } from '@/config/constants'

const Accounts: NextPage = () => {
  const { MyAccounts } = useLoadFeature(MyAccountsFeature)

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
