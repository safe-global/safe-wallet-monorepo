import { useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { BRAND_NAME } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import { SpacesFeature, useIsWorkspaceWizardEnabled } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'

const PlanPage = () => {
  const router = useRouter()
  const isWizard = useIsWorkspaceWizardEnabled()
  const { WorkspaceWizard } = useLoadFeature(SpacesFeature)

  useEffect(() => {
    if (isWizard === false) void router.replace(AppRoutes.welcome.createSpace)
  }, [isWizard, router])

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
