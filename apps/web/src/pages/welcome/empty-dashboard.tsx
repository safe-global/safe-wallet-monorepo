import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'

const EmptyDashboardPage: NextPage = () => {
  const { EmptyDashboardOnboarding } = useLoadFeature(SpacesFeature)
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Dashboard`}</title>
      </Head>
      <EmptyDashboardOnboarding />
    </>
  )
}

export default EmptyDashboardPage
