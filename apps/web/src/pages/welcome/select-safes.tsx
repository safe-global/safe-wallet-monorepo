import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature } from '@/features/spaces/SpacesFeature'
import { useLoadFeature } from '@/features/__core__/useLoadFeature'

const SelectSafesPage: NextPage = () => {
  const { SelectSafesOnboarding } = useLoadFeature(SpacesFeature)
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Select Safe accounts`}</title>
      </Head>

      <SelectSafesOnboarding />
    </>
  )
}

export default SelectSafesPage
