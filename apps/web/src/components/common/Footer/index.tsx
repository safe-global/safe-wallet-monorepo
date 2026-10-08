import type { ReactElement } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { APP_VERSION, APP_HOMEPAGE } from '@/config/version'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { IS_PRODUCTION, COMMIT_HASH, LEGAL_URL } from '@/config/constants'
import type { FooterProps } from '@views/components/common/Footer/footer.type'
import { FooterView } from '@views/components/common/Footer/FooterView'

const footerPages = [
  AppRoutes.settings.index,
  AppRoutes.imprint,
  AppRoutes.cookie,
  AppRoutes.licenses,
  AppRoutes.welcome.accounts,
  AppRoutes.welcome.spaces,
]

const Footer: React.FC<FooterProps> = ({
  forceShow,
  preferences = true,
  versionIcon = true,
  helpCenter = true,
  className,
}): ReactElement | null => {
  const router = useRouter()
  const isOfficialHost = useIsOfficialHost()
  const initialYear = 2025
  const currentYear = new Date().getFullYear()
  const copyrightYear = initialYear === currentYear ? initialYear : `${initialYear}–${currentYear}`

  if (!footerPages.some((path) => router.pathname.startsWith(path)) && !forceShow) {
    return null
  }

  const getHref = (path: string): string => {
    return router.pathname === path ? '' : path
  }

  return (
    <FooterView
      isOfficialHost={isOfficialHost}
      copyrightYear={copyrightYear}
      legalUrl={LEGAL_URL}
      licensesHref={getHref(AppRoutes.licenses)}
      imprintHref={getHref(AppRoutes.imprint)}
      cookieHref={getHref(AppRoutes.cookie)}
      preferencesHref={getHref(AppRoutes.settings.index)}
      preferences={preferences}
      versionIcon={versionIcon}
      helpCenter={helpCenter}
      footerClassName={className}
      appVersion={APP_VERSION}
      appHomepage={APP_HOMEPAGE}
      commitHash={!IS_PRODUCTION && COMMIT_HASH ? COMMIT_HASH : undefined}
    />
  )
}

export default Footer
