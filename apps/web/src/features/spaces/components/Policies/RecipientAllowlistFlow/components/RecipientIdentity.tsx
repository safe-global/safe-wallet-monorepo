import type { ReactElement } from 'react'
import ShortAddress from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/ShortAddress'
import {
  IDENTICON_SIZE,
  IN_ADDRESS_BOOK_LABEL,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import Identicon from '@safe-global/views/components/common/Identicon'
import AddressBookIcon from '@/public/images/sidebar/address-book.svg'
import { spenderDisplayName } from '../../SpendingLimitFlow/Summary/describePolicy'

type RecipientIdentityProps = {
  address: string
  name?: string
  isInAddressBook?: boolean
}

const RecipientIdentity = ({ address, name, isInAddressBook = false }: RecipientIdentityProps): ReactElement => (
  <>
    <Identicon address={address} size={IDENTICON_SIZE} />
    <span className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
      <span className="flex w-full min-w-0 items-center gap-1">
        <span className="truncate">{spenderDisplayName({ name, address })}</span>
        {isInAddressBook && (
          <AddressBookIcon className="size-4 shrink-0 text-muted-foreground" aria-label={IN_ADDRESS_BOOK_LABEL} />
        )}
      </span>
      <ShortAddress address={address} />
    </span>
  </>
)

export default RecipientIdentity
