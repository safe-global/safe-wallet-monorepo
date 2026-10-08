import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

import css from './styles.module.css'
import ExternalLink from '@/components/common/ExternalLink'
import DeleteIcon from '@/public/images/common/delete.svg'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import SettingsCard from '@/components/settings/SettingsCard'

const NoTransactionGuard = () => {
  return <Typography className="mt-4 text-muted-foreground">No transaction guard set</Typography>
}

export type GuardDisplayViewProps = {
  addressInfo: ReactNode
  renderCheckWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
  onRemove: () => void
}

export const GuardDisplayView = ({ addressInfo, renderCheckWallet, onRemove }: GuardDisplayViewProps) => {
  return (
    <div className={css.guardDisplay}>
      {addressInfo}
      {renderCheckWallet((isOk) => (
        <Button variant="ghost" size="icon-sm" onClick={onRemove} disabled={!isOk}>
          <DeleteIcon className="size-4 text-destructive" />
        </Button>
      ))}
    </div>
  )
}

export type TransactionGuardsViewProps = {
  guard?: ReactNode
}

export const TransactionGuardsView = ({ guard }: TransactionGuardsViewProps) => {
  return (
    <SettingsCard title="Transaction guards">
      <div>
        <Typography>
          Transaction guards impose additional constraints that are checked prior to executing a Safe transaction.
          Transaction guards are potentially risky, so make sure to only use transaction guards from trusted sources.
          Learn more about transaction guards{' '}
          <ExternalLink className="font-bold hover:text-muted-foreground" href={HelpCenterArticle.TRANSACTION_GUARD}>
            here
          </ExternalLink>
          .
        </Typography>
        {guard ? guard : <NoTransactionGuard />}
      </div>
    </SettingsCard>
  )
}
