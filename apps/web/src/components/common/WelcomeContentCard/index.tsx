import type { ComponentProps } from 'react'
import { ShadcnProvider } from '@/components/ui/ShadcnProvider'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'

/**
 * White rounded surface that lifts the welcome Accounts and Workspaces tab content
 * above the page's gradient backdrop. Self-contained: it establishes its own shadcn
 * scope (and dark mode) so callers can drop it in anywhere.
 */
const WelcomeContentCard = ({ className, children, ...props }: ComponentProps<'div'>) => {
  const isDarkMode = useDarkMode()

  return (
    <ShadcnProvider dark={isDarkMode}>
      <div
        className={cn(
          'rounded-3xl bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </ShadcnProvider>
  )
}

export default WelcomeContentCard
