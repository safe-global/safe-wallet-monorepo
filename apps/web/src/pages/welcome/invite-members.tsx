import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import WorkspaceOnboardingStep from '@/features/spaces/public/components/WorkspaceOnboardingStep'

const InviteMembersPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Invite members`}</title>
      </Head>

      <WorkspaceOnboardingStep step="invite" />
    </>
  )
}

export default InviteMembersPage
