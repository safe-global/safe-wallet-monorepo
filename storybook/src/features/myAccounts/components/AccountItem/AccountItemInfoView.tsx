import type { ReactNode } from 'react'
import css from '../AccountItems/styles.module.css'
import { cn } from '@/utils/cn'

export type AccountItemInfoViewProps = {
  chainName?: string
  addressInfo: ReactNode
  children?: ReactNode
  monospace: boolean
  testId?: string
}

export const AccountItemInfoView = ({
  chainName,
  addressInfo,
  children,
  monospace,
  testId,
}: AccountItemInfoViewProps) => {
  return (
    <div className={css.accountItemInfo} data-testid={testId}>
      <div className={cn(css.safeAddress, 'text-sm leading-5', monospace && 'font-mono')}>
        {chainName ? <span className="text-muted-foreground text-[length:inherit]">{chainName}</span> : addressInfo}
      </div>
      {children && <div className={css.accountItemInfoChips}>{children}</div>}
    </div>
  )
}
