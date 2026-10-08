import type { ReactNode } from 'react'
import { useDarkMode } from '@/hooks/useDarkMode'
import { OnboardingLayoutView } from '@views/features/spaces/components/OnboardingLayout/OnboardingLayoutView'

interface OnboardingLayoutProps {
  main: ReactNode
  footer?: ReactNode
  sidePanel: ReactNode
  className?: string
  // When provided, the logo invokes this handler instead of linking to
  // /welcome/spaces. Used by the first onboarding step to log a space-less user
  // out, since navigating to /welcome/spaces would bounce them straight back.
  onLogoClick?: () => void
}

const OnboardingLayout = ({ main, footer, sidePanel, className, onLogoClick }: OnboardingLayoutProps) => {
  const isDarkMode = useDarkMode()
  return (
    <OnboardingLayoutView
      isDarkMode={isDarkMode}
      main={main}
      footer={footer}
      sidePanel={sidePanel}
      layoutClassName={className}
      onLogoClick={onLogoClick}
    />
  )
}

export default OnboardingLayout
