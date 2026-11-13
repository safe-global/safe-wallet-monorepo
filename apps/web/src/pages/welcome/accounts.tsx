import Head from 'next/head'
import { useLoadFeature } from '@/features/__core__'
import { MyAccountsFeature } from '@/features/myAccounts'
import { BRAND_NAME } from '@/config/constants'

const Accounts = () => {
  const { MyAccountsV2 } = useLoadFeature(MyAccountsFeature)

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
