import type { ReactElement } from 'react'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { AccountIdentity } from '../../../components/AccountIdentity'
import type { PolicySpender } from '../../../types'
import AllowanceRow from './AllowanceRow'

export type SpenderCardProps = {
  spender: PolicySpender
  label: string
  name?: string
  showUsage: boolean
}

const SpenderCard = ({ spender, label, name, showUsage }: SpenderCardProps): ReactElement => (
  <Card variant="muted" size="none" radius="lg" data-testid="spending-limit-spender">
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center justify-between gap-2">
        <Typography variant="paragraph-small-medium">{label}</Typography>
        <AccountIdentity address={spender.spender} name={name} />
      </div>

      <div className="flex flex-col gap-3">
        {spender.allowances.map((allowance) => (
          <AllowanceRow key={allowance.token.address} allowance={allowance} showUsage={showUsage} />
        ))}
      </div>
    </div>
  </Card>
)

export default SpenderCard
