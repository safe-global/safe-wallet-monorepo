import type { ReactElement } from 'react'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { AccountIdentity } from '../../../components/AccountIdentity'

export type SignatureSafeInfo = {
  address: string
  name?: string
  threshold: number
}

export type SafeSignatureInfoProps = {
  safe: SignatureSafeInfo
  signatures: number
  label?: string
  badgeVariant?: 'warning' | 'destructive'
}

const SafeSignatureInfo = ({
  safe,
  signatures,
  label = 'Parent Safe account',
  badgeVariant,
}: SafeSignatureInfoProps): ReactElement => (
  <div className="flex w-full items-center justify-between gap-3 rounded-lg bg-muted p-3">
    <div className="flex shrink-0 items-center gap-1">
      <Typography variant="paragraph-small-medium">{label}</Typography>
      <Badge
        variant={badgeVariant ?? (signatures >= safe.threshold ? 'success' : 'warning')}
        size="status"
        shape="status"
        data-testid="safe-signature-progress"
      >
        {signatures} of {safe.threshold} signed
      </Badge>
    </div>

    <div className="flex min-w-0 justify-end">
      <AccountIdentity address={safe.address} name={safe.name} />
    </div>
  </div>
)

export default SafeSignatureInfo
