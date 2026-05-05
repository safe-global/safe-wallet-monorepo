import type { ReactElement } from 'react'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import css from './SafeLogo.module.css'

const SafeLogo = ({ href = AppRoutes.welcome.accounts }: { href?: string }): ReactElement => (
  <Link href={href} className="flex size-6 shrink-0 items-center justify-center">
    <img src="/images/logo-no-text.svg" alt="Safe" width={24} height={24} className="size-6 dark:hidden" />
    <span className={`hidden dark:block size-6 shrink-0 rounded-[2px] ${css.logoPrimaryFill}`} />
  </Link>
)

export default SafeLogo
