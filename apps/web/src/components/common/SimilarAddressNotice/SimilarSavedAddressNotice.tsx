import type { ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { SimilarSavedAddress } from '@/features/address-poisoning'
import { SimilarAddressNotice } from './SimilarAddressNotice'
import { SimilarAddressTooltip } from './SimilarAddressTooltip'

export const SimilarSavedAddressNotice = ({
  subject,
  enteredAddress,
  similar,
  chainId,
}: {
  subject: string
  enteredAddress: string
  similar: SimilarSavedAddress
  chainId?: string
}): ReactElement => (
  <SimilarAddressNotice>
    {subject} is similar to{' '}
    <SimilarAddressTooltip
      name={similar.name ?? shortenAddress(similar.address)}
      savedAddress={similar.address}
      enteredAddress={enteredAddress}
      chainId={chainId}
    />{' '}
    in {similar.source === 'accounts' ? 'your accounts' : 'your address book'}.
  </SimilarAddressNotice>
)
