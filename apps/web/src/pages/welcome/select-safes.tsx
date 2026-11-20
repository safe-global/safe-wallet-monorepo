import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import SelectSafesOnboarding from '@/features/spaces/public/components/SelectSafesOnboarding'

const SelectSafesPage = () => {
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
