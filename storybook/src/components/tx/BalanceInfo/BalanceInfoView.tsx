import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'

export type BalanceInfoViewProps = {
  walletBalance: ReactNode
}

export const BalanceInfoView = ({ walletBalance }: BalanceInfoViewProps) => {
  return (
    <div className={css.container}>
      <Typography variant="paragraph-small" className="text-[var(--color-primary-light)]">
        <b>Wallet balance:</b> {walletBalance}
      </Typography>
    </div>
  )
}
