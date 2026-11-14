import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'

const InviteMembersPage = () => {
  const { WorkspaceOnboardingStep } = useLoadFeature(SpacesFeature)
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
