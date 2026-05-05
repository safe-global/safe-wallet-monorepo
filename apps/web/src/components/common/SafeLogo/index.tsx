import type { ReactElement } from 'react'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import css from './SafeLogo.module.css'

const SafeLogo = ({
  href = AppRoutes.welcome.accounts,
  className,
  'data-testid': testId,
}: {
  href?: string
  className?: string
  'data-testid'?: string
}): ReactElement => (
  <Link
    href={href}
    data-testid={testId}
    className={`flex size-6 shrink-0 items-center justify-center${className ? ` ${className}` : ''}`}
  >
    <img
      src="/images/logo-no-text.svg"
      alt="Safe"
      width={24}
      height={24}
      className="size-6 dark:hidden"
      data-testid="logo-image"
    />
    <span className={`hidden dark:block size-6 shrink-0 rounded-[2px] ${css.logoPrimaryFill}`} />
  </Link>
)

export default SafeLogo
