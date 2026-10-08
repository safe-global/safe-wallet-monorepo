import type { ReactElement } from 'react'

export type MetaTagsViewProps = {
  prefetchUrl: string
  brandName: string
  isProduction: boolean
  isBehindIap: boolean
  contentSecurityPolicy: string
  strictTransportSecurity: string
  themeColorLight: string
  themeColorDark: string
}

export function MetaTagsView({
  prefetchUrl,
  brandName,
  isProduction,
  isBehindIap,
  contentSecurityPolicy,
  strictTransportSecurity,
  themeColorLight,
  themeColorDark,
}: MetaTagsViewProps): ReactElement {
  const descriptionText = `${brandName} is the most trusted smart account wallet on Ethereum with over $100B secured.`
  const titleText = brandName

  return (
    <>
      <meta name="description" content={descriptionText} />
      {!isProduction && <meta name="robots" content="noindex" />}

      {/* Social sharing */}
      <meta name="og:image" content="https://app.safe.global/images/social-share.png" />
      <meta name="og:description" content={descriptionText} />
      <meta name="og:title" content={titleText} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@safe" />
      <meta name="twitter:title" content={titleText} />
      <meta name="twitter:description" content={descriptionText} />
      <meta name="twitter:image" content="https://app.safe.global/images/social-share.png" />

      {/* CSP */}
      <meta httpEquiv="Content-Security-Policy" content={contentSecurityPolicy} />
      {isProduction && <meta httpEquiv="Strict-Transport-Security" content={strictTransportSecurity} />}

      {/* Prefetch the backend domain */}
      <link rel="dns-prefetch" href={prefetchUrl} />
      <link rel="preconnect" href={prefetchUrl} crossOrigin="" />

      {/* Mobile tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      {/* PWA primary color and manifest */}
      <meta name="theme-color" content={themeColorLight} media="(prefers-color-scheme: light)" />
      <meta name="theme-color" content={themeColorDark} media="(prefers-color-scheme: dark)" />
      <link rel="manifest" href="/safe.webmanifest" {...(isBehindIap && { crossOrigin: 'use-credentials' })} />

      {/* Favicons */}
      <link rel="shortcut icon" href="/favicons/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png" />
      <link rel="mask-icon" href="/favicons/safari-pinned-tab.svg" color="#000" />
    </>
  )
}
