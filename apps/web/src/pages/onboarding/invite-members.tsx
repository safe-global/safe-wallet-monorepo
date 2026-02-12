import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import InviteMembersOnboarding from '@/components/onboarding/InviteMembersOnboarding'

const InviteMembersPage: NextPage = () => {
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
