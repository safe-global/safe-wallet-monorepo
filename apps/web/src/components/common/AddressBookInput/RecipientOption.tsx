import type { ReactElement } from 'react'
import Identicon from '@/components/common/Identicon'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { isValidAddress } from '@safe-global/utils/utils/validation'
import { ContactSource } from '@/hooks/useAllAddressBooks'
import { formatExactTime, formatRelativeTime, getProvenanceLine, type RecipientContact } from './provenance'
import { RecipientOptionView } from '@views/components/common/AddressBookInput/RecipientOptionView'

const RecipientOption = ({
  contact,
  prefix,
  memberName,
  resolveName,
}: {
  contact: RecipientContact
  prefix?: string
  memberName?: string
  resolveName?: (address: string) => string
}): ReactElement => {
  const isSmallScreen = useMediaQuery('(max-width:1199.95px)')
  const provenance = getProvenanceLine(contact, memberName, resolveName)
  const relativeTime = provenance?.timestamp ? formatRelativeTime(provenance.timestamp) : undefined
  const exactTime = provenance?.timestamp ? formatExactTime(provenance.timestamp) : undefined
  const isLocal = contact.source === ContactSource.local

  return (
    <RecipientOptionView
      name={contact.name}
      address={contact.address}
      prefix={prefix}
      isSmallScreen={isSmallScreen}
      avatar={<Identicon address={contact.address} size={40} />}
      provenance={provenance}
      isLocal={isLocal}
      showCreator={!isLocal && !!contact.createdBy}
      memberName={memberName}
      creatorIdenticon={
        contact.createdBy && isValidAddress(contact.createdBy) ? (
          <Identicon address={contact.createdBy} size={16} />
        ) : null
      }
      relativeTime={relativeTime}
      exactTime={exactTime}
    />
  )
}

export default RecipientOption
