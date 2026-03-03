import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature, useFeatureFlagRedirect } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'

const UserSettingsPage: NextPage = () => {
  const spaces = useLoadFeature(SpacesFeature)
  useFeatureFlagRedirect()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – User Settings`}</title>
      </Head>

      <spaces.UserSettings />
    </>
  )
}

export default UserSettingsPage
