import { WifiOff } from 'lucide-react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { Typography } from '@/components/ui/typography'
import { BRAND_NAME } from '@/config/constants'
import SafeLogo from '@/components/common/SafeLogo'

const Offline: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Offline`}</title>
      </Head>

      <main>
        <div className="fixed top-0 left-0 z-[1300] flex items-center px-6" style={{ height: 'var(--header-height)' }}>
          <SafeLogo />
        </div>
        <div className="flex justify-center">
          <div className="bg-card mb-4 max-w-[900px] rounded-xl p-8">
            <div className="mb-4 flex justify-center">
              <WifiOff className="size-[100px]" />
            </div>

            <Typography variant="h1" align="center">
              Oops, it looks like you&apos;re offline!
            </Typography>

            <Typography className="mt-6">
              We apologize, but it looks like you are currently unable to access our app due to an offline connection.
            </Typography>

            <Typography className="mt-4">
              While you wait for your internet to come back online, we encourage you to take a moment to step outside
              and enjoy the nature. If you have the opportunity, try touching the grass with your bare feet -
              there&apos;s something about the sensation of grass on our skin that can be really grounding and
              refreshing.
            </Typography>

            <Typography className="mt-4">We hope to see you back online soon. Thank you for your patience.</Typography>
          </div>
        </div>
      </main>
    </>
  )
}

export default Offline
