import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import MyAccountsV2 from '@/features/myAccounts/public/components/MyAccountsV2'

const Accounts = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – My accounts`}</title>
      </Head>

      <MyAccountsV2 />
    </>
  )
}

export default Accounts
