import type { NextPage } from 'next'
import Head from 'next/head'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { BRAND_NAME } from '@/config/constants'
import { ImprintView } from '@views/pages/ImprintView'

const Imprint: NextPage = () => {
  const isOfficialHost = useIsOfficialHost()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Imprint`}</title>
      </Head>

      <ImprintView isOfficialHost={isOfficialHost} />
    </>
  )
}

export default Imprint
