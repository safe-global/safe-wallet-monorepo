import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import InviteMembersOnboarding from '@/features/spaces/public/components/InviteMembersOnboarding'

const InviteMembersPage = () => {
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
