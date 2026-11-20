import Head from 'next/head'

import { Typography } from '@safe-global/views/components/ui/typography'
import SettingsHeader from '@/components/settings/SettingsHeader'
import ThemeOptions from '@/components/settings/ThemeOptions'
import { BRAND_NAME } from '@/config/constants'

const Appearance = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Appearance`}</title>
      </Head>
      <SettingsHeader />
      <main>
        <div className="rounded-lg bg-[var(--color-background-paper)] p-8">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_3fr]">
            <div>
              <Typography variant="h4">Theme</Typography>
            </div>

            <ThemeOptions />
          </div>
        </div>
      </main>
    </>
  )
}

export default Appearance
