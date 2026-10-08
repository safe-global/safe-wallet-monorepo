import type { ComponentProps } from 'react'
import { useDarkMode } from '@/hooks/useDarkMode'
import { WelcomeContentCardView } from '@views/components/common/WelcomeContentCard/WelcomeContentCardView'

/**
 * White rounded surface that lifts the welcome Accounts and Workspaces tab content
 * above the page's gradient backdrop. Self-contained: it establishes its own shadcn
 * scope (and dark mode) so callers can drop it in anywhere.
 */
const WelcomeContentCard = ({ className, children, ...props }: ComponentProps<'div'>) => {
  const isDarkMode = useDarkMode()

  return (
    <WelcomeContentCardView isDarkMode={isDarkMode} cardClassName={className} {...props}>
      {children}
    </WelcomeContentCardView>
  )
}

export default WelcomeContentCard
