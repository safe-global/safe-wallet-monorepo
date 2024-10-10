import type { NextPage } from 'next'
import Head from 'next/head'
import MyAccounts from '@/components/welcome/MyAccounts'

const Accounts: NextPage = () => {
  return (
    <>
      <Head>
        <title>Superchain Account – My accounts</title>
      </Head>

      <MyAccounts />
    </>
  )
}

export default Accounts
