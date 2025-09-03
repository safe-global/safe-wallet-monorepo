import type { ReactNode } from 'react'
import AppProviders from './providers'
import MetaTags from '@/components/common/MetaTags'
import { BRAND_NAME } from '@/config/constants'
import { GATEWAY_URL } from '@/config/gateway'
import '@/styles/globals.css'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="emotion-insertion-point" content="" />
        <title key="default-title">{BRAND_NAME}</title>
        <MetaTags prefetchUrl={GATEWAY_URL} />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
