import type { ReactElement } from 'react'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { AccountIdentity } from '../AccountIdentity'

/** The Safe whose signers have to reach the threshold before the policy activates. */
export type SignatureSafeInfo = {
  address: string
  name?: string
  threshold: number
}

export type SafeSignatureInfoProps = {
  safe: SignatureSafeInfo
  /** Signatures already collected, out of the Safe's threshold. */
  signatures: number
  label?: string
}

/** Row pairing a Safe with how far its signature collection has got. */
const SafeSignatureInfo = ({
  safe,
  signatures,
  label = 'Parent Safe account',
}: SafeSignatureInfoProps): ReactElement => (
  <div className="flex w-full items-center justify-between gap-3 rounded-lg bg-muted p-3">
    <div className="flex min-w-0 items-center gap-1">
      <Typography variant="paragraph-small-medium" className="truncate">
        {label}
      </Typography>
      <Badge
        variant={signatures >= safe.threshold ? 'success' : 'warning'}
        size="status"
        shape="status"
        data-testid="safe-signature-progress"
      >
        {signatures} of {safe.threshold} signed
      </Badge>
    </div>

    <AccountIdentity address={safe.address} name={safe.name} />
  </div>
)

export default SafeSignatureInfo
