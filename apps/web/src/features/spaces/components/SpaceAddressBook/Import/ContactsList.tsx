import ChainIndicator from '@/components/common/ChainIndicator'
import EthHashInfo from '@/components/common/EthHashInfo'
import css from '@/features/spaces/components/AddAccounts/styles.module.css'
import { Box, Checkbox, List, ListItem, Tooltip } from '@mui/material'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import type { ImportContactsFormValues } from '@/features/spaces/components/SpaceAddressBook/Import/ImportAddressBookDialog'
import { getSelectedAddresses, getContactId } from '@/features/spaces/components/SpaceAddressBook/utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useGetSpaceAddressBook from '@/features/spaces/hooks/useGetSpaceAddressBook'

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
    <List
      sx={{
        pt: 0,
        px: 2,
        pb: 2,
        mt: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        height: 400,
        overflow: 'auto',
      }}
    >
      {contactItems.map((contactItem) => {
        const contactItemId = getContactId(contactItem)
        const alreadyAdded = spaceContacts.some((spaceContact) =>
          sameAddress(spaceContact.address, contactItem.address),
        )

        return (
          <Controller
            key={`${contactItemId}`}
            name={`contacts.${contactItemId}`}
            control={control}
            render={({ field }) => {
              const isSelected = Boolean(field.value)
              const isSameAddressSelected = selectedAddresses.has(contactItem.address) && !isSelected

              const handleItemClick = () => {
                field.onChange(field.value ? false : contactItem.name)
              }

              return (
                <Tooltip
                  title={
                    isSameAddressSelected || alreadyAdded ? 'You already added a contact with this address.' : undefined
                  }
                  arrow
                >
                  <ListItem className={css.safeItem} disablePadding>
                    <ListItemButton onClick={handleItemClick} disabled={alreadyAdded || isSameAddressSelected}>
                      <ListItemIcon onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected || alreadyAdded}
                          onChange={(event) => field.onChange(event.target.checked ? contactItem.name : false)}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box className={css.safeRow}>
                            <Box overflow="auto">
                              <EthHashInfo
                                address={contactItem.address}
                                chainId={contactItem.chainId}
                                name={contactItem.name}
                                copyAddress={false}
                              />
                            </Box>
                            <ChainIndicator chainId={contactItem.chainId} responsive onlyLogo />
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              )
            }}
          />
        )
      })}
    </List>
  )
}

export default ContactsList
