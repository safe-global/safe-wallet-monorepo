import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import SurveyOnboarding from '@/features/spaces/components/SurveyOnboarding'

const SurveyPage: NextPage = () => {
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
