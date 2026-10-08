import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

export type CopyAddressButtonViewProps = {
  hashInfo: ReactNode
}

/** The untrusted-address warning shown in the copy confirmation dialog. */
export function CopyAddressButtonView({ hashInfo }: CopyAddressButtonViewProps): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      {hashInfo}
      <Typography>
        The copied address is linked to a transaction with an untrusted token. Make sure you are interacting with the
        right address.
      </Typography>
    </div>
  )
}
