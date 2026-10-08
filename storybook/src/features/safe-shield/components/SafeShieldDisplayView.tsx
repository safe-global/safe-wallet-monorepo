import { type ReactElement, type ReactNode } from 'react'
import SafeShieldLogoFull from '@/public/images/safe-shield/safe-shield-logo.svg'
import SafeShieldLogoFullDark from '@/public/images/safe-shield/safe-shield-logo-dark.svg'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

const shieldLogoOnHover = [
  'cursor-pointer',
  '[&_.shield-img]:transition-[fill] [&_.shield-lines]:transition-[fill] [&_.shield-text]:transition-[fill]',
  'hover:[&_.shield-bg]:fill-[var(--color-background-secondary)]',
  'hover:[&_.shield-img]:fill-[var(--color-static-text-brand)]',
  'hover:[&_.shield-lines]:fill-[var(--color-static-main)]',
  'hover:[&_.shield-text]:fill-[var(--color-text-primary)]',
].join(' ')

export type SafeShieldDisplayViewProps = {
  isDarkMode: boolean
  header: ReactNode
  content: ReactNode
}

export const SafeShieldDisplayView = ({ isDarkMode, header, content }: SafeShieldDisplayViewProps): ReactElement => {
  const SafeShieldLogo = isDarkMode ? SafeShieldLogoFullDark : SafeShieldLogoFull

  return (
    <div className="flex flex-col gap-2" data-testid="safe-shield-widget">
      {/* 16px outer radius − 4px inset (px-1) = 12px inner radius, so the curves stay concentric. */}
      <div className="overflow-hidden rounded-lg bg-card">
        {header}

        {content}
      </div>

      <div className="flex flex-row items-center self-end">
        <ExternalLink href={HelpCenterArticle.SAFE_SHIELD} noIcon>
          <SafeShieldLogo data-testid="safe-shield-logo" width={78} height={18} className={shieldLogoOnHover} />
        </ExternalLink>
      </div>
    </div>
  )
}
