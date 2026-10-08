import type { NextPage } from 'next'
import Head from 'next/head'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { BRAND_NAME } from '@/config/constants'
import SafeCookiePolicy from '@/markdown/cookie/cookie.md'
import { CookiePolicyView, cookiePolicyComponents } from '@views/pages/CookiePolicyView'

const CookiePolicy: NextPage = () => {
  const isOfficialHost = useIsOfficialHost()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Cookie policy`}</title>
      </Head>

      <CookiePolicyView
        isOfficialHost={isOfficialHost}
        policy={<SafeCookiePolicy components={cookiePolicyComponents} />}
      />
    </>
  )
}

export default CookiePolicy
