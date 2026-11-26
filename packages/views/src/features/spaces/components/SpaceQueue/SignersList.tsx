import type { ReactElement } from 'react'
import { Circle, CircleCheck } from 'lucide-react'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { cn } from '@safe-global/views/utils/cn'
import Identicon from '@safe-global/views/components/common/Identicon'

const SKELETON_ROWS = 3
/** Rows shown before the rest fold into "+N more", so a large Safe doesn't grow the tooltip past the viewport */
export const MAX_SIGNER_ROWS = 6

export type SignerRow = {
  address: string
  name: string
  signed: boolean
}

export type SignersListProps = {
  header: string
  isLoading: boolean
  signers: SignerRow[]
  /** A line under the list, such as why the user can't sign */
  note?: string
  /** Lists the rows without the signed mark, for a list that isn't about signing */
  hideStatus?: boolean
}

const SignerItem = ({ address, name, signed, hideStatus }: SignerRow & { hideStatus?: boolean }): ReactElement => (
  <li
    data-testid="signer-row"
    data-signed={signed}
    className={cn('flex items-center gap-2', !signed && 'text-background/60')}
  >
    {hideStatus ? null : signed ? (
      <CircleCheck aria-label="Signed" className="size-4 shrink-0 fill-success-strong text-foreground" />
    ) : (
      <Circle aria-label="Not signed" className="size-4 shrink-0 text-background/40" />
    )}
    <Identicon address={address} size={18} />
    <span className="truncate">{name}</span>
  </li>
)

const SignersList = ({ header, isLoading, signers, note, hideStatus }: SignersListProps): ReactElement => (
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
        {signers.slice(0, MAX_SIGNER_ROWS).map((signer) => (
          <SignerItem key={signer.address} {...signer} hideStatus={hideStatus} />
        ))}
      </ul>
    )}
    {signers.length > MAX_SIGNER_ROWS && <p className="text-background/60">+{signers.length - MAX_SIGNER_ROWS} more</p>}
    {note && <p className="text-background/60">{note}</p>}
  </div>
)

export default SignersList
