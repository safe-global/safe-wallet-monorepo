import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'
import SafeLogo from '@/public/images/logo-no-text.svg'
import OnboardingIllustration from './Illustration'

type OnboardingLayoutProps = {
  step?: { current: number; total: number }
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  illustration?: ReactNode
  contentClassName?: string
}

const OnboardingLayout = ({
  step,
  title,
  description,
  children,
  footer,
  illustration,
  contentClassName,
}: OnboardingLayoutProps): ReactElement => {
  const isDarkMode = useDarkMode()

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className="flex min-h-dvh w-full flex-col bg-card lg:flex-row">
        <section className="relative flex w-full flex-col px-6 py-8 sm:px-10 lg:w-1/2 lg:px-16 lg:py-12">
          <SafeLogo alt="Safe logo" width={32} height={32} />

          <div className={cn('mt-12 flex w-full max-w-[440px] flex-1 flex-col gap-6', contentClassName)}>
            {step && (
              <p
                data-testid="step-indicator"
                className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                role="group"
                aria-label={`Step ${step.current} of ${step.total}`}
              >
                Step {step.current} / {step.total}
              </p>
            )}

            <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground">{title}</h1>

            {description && <p className="text-sm leading-5 text-muted-foreground">{description}</p>}

            <div className="flex min-h-0 flex-1 flex-col gap-4">{children}</div>
          </div>

          {footer && <div className="mt-8 flex w-full max-w-[440px] items-center gap-3">{footer}</div>}
        </section>

        <aside className="relative hidden items-center justify-center overflow-hidden bg-[var(--onboarding-illustration-bg,_#f4f4f4)] lg:flex lg:w-1/2">
          {illustration ?? <OnboardingIllustration />}
        </aside>
      </div>
    </div>
  )
}

export default OnboardingLayout
