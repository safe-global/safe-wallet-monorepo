import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'

const InviteMembersPage: NextPage = () => {
  const { InviteMembersOnboarding } = useLoadFeature(SpacesFeature)
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Invite members`}</title>
      </Head>

      <InviteMembersOnboarding />
    </>
  )
}

export default InviteMembersPage
