import type { ReactElement } from 'react'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import { cn } from '@/utils/cn'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'
import css from './SafeLogo.module.css'

const LogoMark = (): ReactElement => (
  <>
    <img
      src="/images/logo-no-text.svg"
      alt="Safe"
      width={24}
      height={24}
      className="size-6 group-data-[collapsible=icon]:size-4.5 dark:hidden"
      data-testid="logo-image"
    />
    <span
      className={`hidden dark:block size-6 group-data-[collapsible=icon]:size-4.5 shrink-0 rounded-[2px] ${css.logoPrimaryFill}`}
    />
  </>
)

const SafeLogo = ({
  href = AppRoutes.welcome.spaces,
  className,
  showHomeLabel = false,
  showProLockup = false,
  'data-testid': testId,
}: {
  href?: string
  className?: string
  /** Renders a logo + "Home" label pill (Safe/space context) instead of the bare logo. */
  showHomeLabel?: boolean
  /** Workspace on a live Safe Pro plan: the pill carries the logo and the PRO chip instead of logo + "Home". */
  showProLockup?: boolean
  'data-testid'?: string
}): ReactElement => {
  if (showHomeLabel) {
    return (
      <Link
        href={href}
        data-testid={testId}
        className={cn(
          'flex items-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2 text-sidebar-accent-foreground transition-opacity hover:opacity-80',
          className,
        )}
      >
        <LogoMark />
        {showProLockup ? (
          <span className="block h-4 w-6 shrink-0" role="img" aria-label="Safe Pro">
            <ProChip className="size-full" />
          </span>
        ) : (
          <span className="text-sm font-semibold">Home</span>
        )}
      </Link>
    )
  }

  return (
    <Link
      href={href}
      data-testid={testId}
      className={cn('flex size-6 shrink-0 items-center justify-center', className)}
    >
      <LogoMark />
    </Link>
  )
}

export default SafeLogo
