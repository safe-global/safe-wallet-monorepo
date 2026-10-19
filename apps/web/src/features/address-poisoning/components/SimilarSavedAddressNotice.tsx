import type { ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { SimilarAddressNotice, SimilarAddressTooltip } from '@/components/common/SimilarAddressNotice'
import type { SimilarSavedAddress } from '../hooks/useAddressPoisoningCheck'

/**
 * "<subject> is similar to <saved name> in your address book / accounts." Hovering the name compares
 * the two addresses. An unnamed saved address is shown shortened.
 */
const SimilarSavedAddressNotice = ({
  subject,
  enteredAddress,
  similar,
}: {
  subject: string
  enteredAddress: string
  similar: SimilarSavedAddress
}): ReactElement => (
  <SimilarAddressNotice>
    {subject} is similar to{' '}
    <SimilarAddressTooltip
      name={similar.name ?? shortenAddress(similar.address)}
      savedAddress={similar.address}
      enteredAddress={enteredAddress}
    />{' '}
    in {similar.source === 'accounts' ? 'your accounts' : 'your address book'}.
  </SimilarAddressNotice>
)

export default SimilarSavedAddressNotice
