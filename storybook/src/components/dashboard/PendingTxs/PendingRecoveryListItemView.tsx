import Link, { type LinkProps } from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'
import classnames from 'classnames'
import css from './styles.module.css'

export type PendingRecoveryListItemViewProps = {
  url: LinkProps['href']
  recoveryType: ReactNode
  recoveryInfo: ReactNode
  recoveryStatus: ReactNode
}

export function PendingRecoveryListItemView({
  url,
  recoveryType,
  recoveryInfo,
  recoveryStatus,
}: PendingRecoveryListItemViewProps): ReactElement {
  return (
    <Link href={url} passHref>
      <div className={classnames(css.container, css.recoveryContainer, 'min-h-[50px]')}>
        {recoveryType}

        {recoveryInfo}

        <div className="ml-auto flex flex-row items-center gap-3">
          {recoveryStatus}
          <ChevronRight className="size-5 text-[var(--color-border-main)]" />
        </div>
      </div>
    </Link>
  )
}
