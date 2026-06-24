import ChainIndicator from '@/components/common/ChainIndicator'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import type { ImportContactsFormValues } from './ImportAddressBookDialog'
import { getSelectedAddresses, getContactId } from '../utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ALLOWED_NAME_REGEX } from '@safe-global/utils/validation/names'
import { useGetSpaceAddressBook } from '@/features/spaces'
import { cn } from '@/utils/cn'

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
    <ul className="flex flex-col gap-2 mt-2 px-4 pb-4 pt-0 h-[400px] overflow-auto">
      {contactItems.map((contactItem) => {
        const contactItemId = getContactId(contactItem)
        const alreadyAdded = spaceContacts.some((spaceContact) =>
          sameAddress(spaceContact.address, contactItem.address),
        )
        const hasInvalidChars = !ALLOWED_NAME_REGEX.test(contactItem.name)

        return (
          <Controller
            key={contactItemId}
            name={`contacts.${contactItemId}`}
            control={control}
            render={({ field }) => {
              const isSelected = Boolean(field.value)
              const isSameAddressSelected = selectedAddresses.has(contactItem.address) && !isSelected
              const disabled = alreadyAdded || isSameAddressSelected || hasInvalidChars

              const setSelected = (next: boolean) => field.onChange(next ? contactItem.name : false)

              const toggle = () => {
                if (disabled) return
                setSelected(!isSelected)
              }

              const row = (
                <div
                  role="button"
                  tabIndex={disabled ? -1 : 0}
                  aria-disabled={disabled}
                  onClick={toggle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggle()
                    }
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left',
                    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted',
                  )}
                >
                  <Checkbox
                    // alreadyAdded contacts show as ticked to indicate they're already in the space, even though the form value is undefined
                    checked={isSelected || alreadyAdded}
                    disabled={disabled}
                    onClick={(e) => e.stopPropagation()}
                    onCheckedChange={(checked) => setSelected(Boolean(checked))}
                  />
                  <div className="flex-1 flex items-center justify-between overflow-hidden">
                    <div className="overflow-auto">
                      <EthHashInfo
                        address={contactItem.address}
                        chainId={contactItem.chainId}
                        name={contactItem.name}
                        copyAddress={false}
                      />
                    </div>
                    <ChainIndicator chainId={contactItem.chainId} responsive onlyLogo />
                  </div>
                </div>
              )

              return (
                <li>
                  {disabled ? (
                    <Tooltip>
                      <TooltipTrigger render={<div />} className="block w-full">
                        {row}
                      </TooltipTrigger>
                      <TooltipContent>
                        {hasInvalidChars
                          ? 'This contact contains invalid characters. Edit the contact before adding it to a workspace.'
                          : alreadyAdded
                            ? 'You already added a contact with this address.'
                            : 'You already selected a contact with this address.'}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    row
                  )}
                </li>
              )
            }}
          />
        )
      })}
    </ul>
  )
}

export default ContactsList
