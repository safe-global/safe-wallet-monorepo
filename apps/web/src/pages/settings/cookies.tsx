import { CookieAndTermBanner } from '@/components/common/CookieAndTermBanner'
import SettingsHeader from '@/components/settings/SettingsHeader'
import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { CookiesSettingsView } from '@views/pages/settings/CookiesSettingsView'

const Cookies: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Cookies`}</title>
      </Head>

      <SettingsHeader />

      <CookiesSettingsView cookieBanner={<CookieAndTermBanner />} />
    </>
  )
}

export default Cookies
