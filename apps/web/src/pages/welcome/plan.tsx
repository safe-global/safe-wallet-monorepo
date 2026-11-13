import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature, useIsWorkspaceWizardEnabled } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'

/** Only in the onboarding wizard; the route guard sends the user to the first step when the wizard is off. */
const PlanPage = () => {
  const isWizard = useIsWorkspaceWizardEnabled()
  const { WorkspaceWizard } = useLoadFeature(SpacesFeature)

  if (!isWizard) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Pick your plan`}</title>
      </Head>
      <WorkspaceWizard step="plan" />
    </>
  )
}

export default PlanPage
