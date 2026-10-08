import type { ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import EarnIcon from '@/public/images/common/earn.svg'
import StakeIcon from '@/public/images/common/stake.svg'

const APP_LOGO_FALLBACK_IMAGE = '/images/apps/apps-icon.svg'
const APP_NAME_FALLBACK = 'Sign message'

export type AppTitleInlineIcon = 'earn' | 'stake'

/** Inline SVG to support currentColor in dark mode */
const InlineIcon = ({ icon }: { icon: AppTitleInlineIcon }) => {
  if (icon === 'earn') {
    return <EarnIcon className="size-8" />
  }
  if (icon === 'stake') {
    return <StakeIcon className="size-8" />
  }
  return null
}

export type AppTitleViewProps = {
  name?: string | null
  logoUri?: string | null
  inlineIcon?: AppTitleInlineIcon
  customTitle?: string
}

export const AppTitleView = ({ name, logoUri, inlineIcon, customTitle }: AppTitleViewProps): ReactElement => {
  const appName = name || APP_NAME_FALLBACK
  const appLogo = logoUri || APP_LOGO_FALLBACK_IMAGE
  const title = customTitle || appName

  return (
    <div className="flex items-center">
      {inlineIcon && name ? (
        <InlineIcon icon={inlineIcon} />
      ) : (
        <SafeAppIconCard src={appLogo} alt={name || 'The icon of the application'} width={32} height={32} />
      )}
      <Typography variant="h4" as="span" className="pl-4 font-bold">
        {title}
      </Typography>
    </div>
  )
}

export const SignMessageErrorFallbackView = (): ReactElement => <div>Error signing message</div>
