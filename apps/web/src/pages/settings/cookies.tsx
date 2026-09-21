import { CookieAndTermBanner } from 'src/components/common/CookieAndTermBanner'
import SettingsHeader from '@/components/settings/SettingsHeader'
import { Typography } from '@/components/ui/typography'
import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'

const Cookies: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Cookies`}</title>
      </Head>

      <SettingsHeader />

      <main>
        <div className="mb-4 rounded-lg bg-[var(--color-background-paper)] p-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_2fr]">
            <div>
              <Typography variant="h4">Cookie preferences</Typography>
            </div>

            <div>
              <CookieAndTermBanner />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default Cookies
