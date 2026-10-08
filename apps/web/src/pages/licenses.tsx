import type { NextPage } from 'next'
import Head from 'next/head'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { BRAND_NAME } from '@/config/constants'
import { LicensesView } from '@views/pages/LicensesView'

const Licenses: NextPage = () => {
  const isOfficialHost = useIsOfficialHost()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Licenses`}</title>
      </Head>

      <LicensesView isOfficialHost={isOfficialHost} brandName={BRAND_NAME} />
    </>
  )
}

export default Licenses
