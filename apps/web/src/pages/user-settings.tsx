import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import UserSettings from '@/features/spaces/components/UserSettings'

const UserSettingsPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – User Settings`}</title>
      </Head>

      <UserSettings />
    </>
  )
}

export default UserSettingsPage
