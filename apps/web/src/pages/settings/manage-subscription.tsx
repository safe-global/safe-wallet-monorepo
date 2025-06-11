import type { NextPage } from 'next'
import Head from 'next/head'
import SettingsHeader from '@/components/settings/SettingsHeader'
import { BRAND_NAME } from '@/config/constants'
import Pro from '@/components/pro/index'

const ManageSubscription: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Data`}</title>
      </Head>

      <SettingsHeader />

      <main>
        <Pro />
      </main>
    </>
  )
}

export default ManageSubscription
