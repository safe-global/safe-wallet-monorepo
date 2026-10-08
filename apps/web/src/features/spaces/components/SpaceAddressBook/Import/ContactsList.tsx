import ChainIndicator from '@/components/common/ChainIndicator'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import type { ImportContactsFormValues } from './ImportAddressBookDialog'
import { getSelectedAddresses, getContactId, validateContactName } from '../utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useGetSpaceAddressBook } from '@/features/spaces'
import {
  ContactRowView,
  ContactsListView,
} from '@views/features/spaces/components/SpaceAddressBook/Import/ContactsListView'

export type ContactItem = {
  chainId: string
  address: string
  name: string
}

const ContactsList = ({ contactItems }: { contactItems: ContactItem[] }) => {
  const { control } = useFormContext<ImportContactsFormValues>()
  const selectedContacts = useWatch({ control, name: 'contacts' })
  const selectedAddresses = getSelectedAddresses(selectedContacts)
  const spaceContacts = useGetSpaceAddressBook()

  return (
    <ContactsListView>
      {contactItems.map((contactItem) => {
        const contactItemId = getContactId(contactItem)
        const alreadyAdded = spaceContacts.some((spaceContact) =>
          sameAddress(spaceContact.address, contactItem.address),
        )

        return (
          <Controller
            key={contactItemId}
            name={`contacts.${contactItemId}`}
            control={control}
            render={({ field }) => {
              const isSelected = Boolean(field.value)
              const isSameAddressSelected = selectedAddresses.has(contactItem.address) && !isSelected
              const nameError = validateContactName(contactItem.name)
              const disabled = alreadyAdded || isSameAddressSelected || !!nameError

              const setSelected = (next: boolean) => field.onChange(next ? contactItem.name : false)

              const toggle = () => {
                if (disabled) return
                setSelected(!isSelected)
              }

              return (
                <ContactRowView
                  isSelected={isSelected}
                  alreadyAdded={alreadyAdded}
                  nameError={nameError}
                  disabled={disabled}
                  onToggle={toggle}
                  onSelectedChange={setSelected}
                  addressInfo={
                    <EthHashInfo
                      address={contactItem.address}
                      chainId={contactItem.chainId}
                      name={contactItem.name}
                      copyAddress={false}
                    />
                  }
                  chainLogo={<ChainIndicator chainId={contactItem.chainId} responsive onlyLogo />}
                />
              )
            }}
          />
        )
      })}
    </ContactsListView>
  )
}

export default ContactsList
