import type { ComponentProps, ReactElement } from 'react'
import { ShadcnProvider } from '@/components/ui/ShadcnProvider'
import { cn } from '@/utils/cn'

export type WelcomeContentCardViewProps = Omit<ComponentProps<'div'>, 'className'> & {
  isDarkMode: boolean
  cardClassName?: string
}

/**
 * White rounded surface that lifts the welcome Accounts and Workspaces tab content
 * above the page's gradient backdrop.
 */
export function WelcomeContentCardView({
  isDarkMode,
  cardClassName,
  children,
  ...props
}: WelcomeContentCardViewProps): ReactElement {
  return (
    <ShadcnProvider dark={isDarkMode}>
      <div
        className={cn(
          'rounded-3xl bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]',
          cardClassName,
        )}
        {...props}
      >
        {children}
      </div>
    </ShadcnProvider>
  )
}
