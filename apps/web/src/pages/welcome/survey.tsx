import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'

const SurveyPage: NextPage = () => {
  const { SurveyOnboarding } = useLoadFeature(SpacesFeature)
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – How will you use Safe?`}</title>
      </Head>

      <SurveyOnboarding />
    </>
  )
}

export default SurveyPage
