import { FormProvider, useForm } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  DialogActions,
  DialogContent,
  InputAdornment,
  SvgIcon,
  TextField,
  Typography,
} from '@mui/material'

import ModalDialog from '@/components/common/ModalDialog'
import ContactsList, {
  type ContactItem,
  getContactId,
} from '@/features/spaces/components/SpaceAddressBook/Import/ContactsList'
import React, { useCallback, useMemo, useState } from 'react'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import css from '@/features/spaces/components/AddAccounts/styles.module.css'
import SearchIcon from '@/public/images/common/search.svg'
import { debounce } from 'lodash'
import { flattenAddressBook, useContactSearch } from '@/features/spaces/components/SpaceAddressBook/useContactSearch'

const createContactItems = (data: ImportContactsFormValues) => {
  return Object.entries(data.contacts)
    .map(([contactItemId, name]) => {
      const [chainId, address] = contactItemId.split(':')
      if (!name) return

      return {
        chainId,
        address,
        name,
      }
    })
    .filter(Boolean) as ContactItem[]
}

export type ImportContactsFormValues = {
  contacts: Record<string, string> // e.g. "1:0x123": "Alice"
}

const ImportContactsDialog = ({ handleClose }: { handleClose: () => void }) => {
  const [error, setError] = useState<string>()
  const [searchQuery, setSearchQuery] = useState('')

  const allAddressBooks = useAllAddressBooks()
  const allContactItems = useMemo(() => flattenAddressBook(allAddressBooks), [allAddressBooks])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(debounce(setSearchQuery, 300), [])
  const filteredEntries = useContactSearch(allAddressBooks, searchQuery)

  const formMethods = useForm<ImportContactsFormValues>({
    mode: 'onChange',
    defaultValues: {
      contacts: {},
    },
  })

  const { handleSubmit, formState, setValue, watch } = formMethods

  const selectedContacts = watch('contacts')
  const selectedContactsLength = Object.values(selectedContacts).filter(Boolean)

  const selectAll = () => {
    allContactItems.forEach((item) => {
      const itemId = getContactId(item)
      setValue(`contacts.${itemId}`, item.name)
    })
  }

  const onSubmit = handleSubmit(async (data) => {
    setError(undefined)
    const contactItems = createContactItems(data)
    console.log(contactItems)
  })

  return (
    <ModalDialog
      open
      onClose={handleClose}
      hideChainIndicator
      fullScreen
      PaperProps={{ sx: { backgroundColor: 'border.background' } }}
    >
      <DialogContent sx={{ display: 'flex', alignItems: 'center' }}>
        <Container fixed maxWidth="sm" disableGutters>
          <Typography component="div" variant="h1" mb={3}>
            Import address book
          </Typography>
          <Card sx={{ border: '0' }}>
            <FormProvider {...formMethods}>
              <form onSubmit={onSubmit}>
                <Box px={2} pt={2} mb={2}>
                  <TextField
                    id="search-by-name"
                    placeholder="Search"
                    aria-label="Search contact list by name or address"
                    variant="filled"
                    hiddenLabel
                    onChange={(e) => {
                      handleSearch(e.target.value)
                    }}
                    className={css.search}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SvgIcon
                            component={SearchIcon}
                            inheritViewBox
                            fontWeight="bold"
                            fontSize="small"
                            sx={{
                              color: 'var(--color-border-main)',
                              '.MuiInputBase-root.Mui-focused &': { color: 'var(--color-text-primary)' },
                            }}
                          />
                        </InputAdornment>
                      ),
                      disableUnderline: true,
                    }}
                    fullWidth
                    size="small"
                  />
                </Box>

                {searchQuery ? (
                  <ContactsList contactItems={filteredEntries} />
                ) : (
                  <ContactsList contactItems={allContactItems} />
                )}

                <Box m={2}>
                  <Button onClick={selectAll}>Select all</Button>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}

                <DialogActions>
                  <Button data-testid="cancel-btn" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" disabled={!formState.isValid} disableElevation>
                    Import contacts ({selectedContactsLength.length})
                  </Button>
                </DialogActions>
              </form>
            </FormProvider>
          </Card>
        </Container>
      </DialogContent>
    </ModalDialog>
  )
}

export default ImportContactsDialog
