import type { ReactNode } from 'react'
import Link from 'next/link'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import { AppRoutes } from '@/config/routes'
import SafeLogo from '@/public/images/logo-no-text.svg'

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

const logoClassName =
  'mb-10 shrink-0 inline-flex w-fit rounded outline-none focus-visible:ring-2 focus-visible:ring-ring'

// A single fixed split across every onboarding step so the form column and side-panel
// stay put between steps (no width jump). Sized to host the widest step, the Select Safes table.
const OnboardingLayout = ({ main, footer, sidePanel, className, onLogoClick }: OnboardingLayoutProps) => {
  const isDarkMode = useDarkMode()
  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className={cn('flex h-dvh w-full overflow-hidden bg-background p-4', className)}>
        <main className="flex h-full w-full flex-col overflow-hidden bg-background p-4 sm:p-8 xl:w-[56%]">
          <div className="mx-auto flex w-full max-w-[780px] flex-1 flex-col min-h-0">
            {onLogoClick ? (
              <button type="button" onClick={onLogoClick} aria-label="Back to Spaces" className={logoClassName}>
                <SafeLogo alt="Safe" width={22} height={22} />
              </button>
            ) : (
              <Link href={AppRoutes.welcome.spaces} aria-label="Back to Spaces" className={logoClassName}>
                <SafeLogo alt="Safe" width={22} height={22} />
              </Link>
            )}
            <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-y-auto">{main}</div>
            {footer && <div className="mt-auto pt-8 shrink-0">{footer}</div>}
          </div>
        </main>
        <aside className="hidden h-full overflow-hidden rounded-3xl bg-muted xl:flex xl:w-[44%]">{sidePanel}</aside>
      </div>
    </div>
  )
}

export default OnboardingLayout
