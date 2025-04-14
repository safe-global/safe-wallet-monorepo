import ChainIndicator from '@/components/common/ChainIndicator'
import EthHashInfo from '@/components/common/EthHashInfo'
import css from '@/features/spaces/components/AddAccounts/styles.module.css'
import { Box, Checkbox, List, ListItem } from '@mui/material'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import type { ImportContactsFormValues } from '@/features/spaces/components/SpaceAddressBook/Import/ImportAddressBookDialog'
import { getSelectedAddresses, getContactId } from '@/features/spaces/components/SpaceAddressBook/utils'

export type ContactItem = {
  chainId: string
  address: string
  name: string
}

const ContactsList = ({ contactItems }: { contactItems: ContactItem[] }) => {
  const { control } = useFormContext<ImportContactsFormValues>()
  const selectedContacts = useWatch({ control, name: 'contacts' })
  const selectedAddresses = getSelectedAddresses(selectedContacts)

  const spaceContacts: ContactItem[] = [] // TODO: Fetch via RTK Query

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
        maxHeight: 400,
        minHeight: 400,
        overflow: 'auto',
      }}
    >
      {contactItems.map((contactItem) => {
        const contactItemId = getContactId(contactItem)
        const alreadyAdded = spaceContacts.some(
          (spaceContact) =>
            spaceContact.address === contactItem.address && spaceContact.chainId === contactItem.chainId,
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
                field.onChange(field.value ? undefined : contactItem.name)
              }

              return (
                <ListItem className={css.safeItem} disablePadding>
                  <ListItemButton onClick={handleItemClick} disabled={alreadyAdded || isSameAddressSelected}>
                    <ListItemIcon onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected || alreadyAdded}
                        onChange={(event) => field.onChange(event.target.checked ? contactItem.name : undefined)}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box className={css.safeRow}>
                          <EthHashInfo
                            address={contactItem.address}
                            chainId={contactItem.chainId}
                            name={contactItem.name}
                            copyAddress={false}
                          />
                          <ChainIndicator chainId={contactItem.chainId} responsive onlyLogo />
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              )
            }}
          />
        )
      })}
    </List>
  )
}

export default ContactsList
