import type { ReactElement } from 'react'
import { Circle, CircleCheck } from 'lucide-react'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { cn } from '@safe-global/views/utils/cn'
import Identicon from '@safe-global/views/components/common/Identicon'

const SKELETON_ROWS = 3

export type SignerRow = {
  address: string
  name: string
  signed: boolean
}

export type SignersListProps = {
  header: string
  isLoading: boolean
  signers: SignerRow[]
}

const SignerItem = ({ address, name, signed }: SignerRow): ReactElement => (
  <li
    data-testid="signer-row"
    data-signed={signed}
    className={cn('flex items-center gap-2', !signed && 'text-background/60')}
  >
    {signed ? (
      <CircleCheck aria-label="Signed" className="size-4 shrink-0 fill-success-strong text-foreground" />
    ) : (
      <Circle aria-label="Not signed" className="size-4 shrink-0 text-background/40" />
    )}
    <Identicon address={address} size={18} />
    <span className="truncate">{name}</span>
  </li>
)

const SignersList = ({ header, isLoading, signers }: SignersListProps): ReactElement => (
  <div className="flex flex-col gap-2 py-1">
    <p className="whitespace-nowrap font-medium">{header}</p>
    {isLoading && (
      <ul className="flex flex-col gap-1.5" aria-busy="true">
        {Array.from({ length: SKELETON_ROWS }, (_, i) => (
          <li key={i} className="flex items-center gap-2">
            <Skeleton className="size-4 rounded-full bg-background/20" />
            <Skeleton className="h-3 w-20 bg-background/20" />
          </li>
        ))}
      </ul>
    )}
    {signers.length > 0 && (
      <ul className="flex flex-col gap-1.5">
        {signers.map((signer) => (
          <SignerItem key={signer.address} {...signer} />
        ))}
      </ul>
    )}
  </div>
)

export default SignersList
