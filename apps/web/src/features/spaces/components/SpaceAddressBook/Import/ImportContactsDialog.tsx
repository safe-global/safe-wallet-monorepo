import { FormProvider, useForm } from 'react-hook-form'
import { Alert, Box, Button, DialogActions, DialogContent, InputAdornment, SvgIcon, TextField } from '@mui/material'

import ModalDialog from '@/components/common/ModalDialog'
import ContactsList, { type ContactItem } from '@/features/spaces/components/SpaceAddressBook/Import/ContactsList'
import React, { useCallback, useMemo, useState } from 'react'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import css from '@/features/spaces/components/AddAccounts/styles.module.css'
import SearchIcon from '@/public/images/common/search.svg'
import { debounce } from 'lodash'
import { flattenAddressBook, useContactSearch } from '@/features/spaces/components/SpaceAddressBook/useContactSearch'

const createContactItem = (data: ImportContactsFormValues) => {
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

  const { handleSubmit, formState } = formMethods

  const onSubmit = handleSubmit(async (data) => {
    setError(undefined)
    const contactItems = createContactItem(data)
    console.log(contactItems)
  })

  return (
    <ModalDialog open onClose={handleClose} dialogTitle="Import contacts" hideChainIndicator>
      <FormProvider {...formMethods}>
        <form onSubmit={onSubmit}>
          <DialogContent sx={{ py: 2 }}>
            <Box>
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

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>

          <DialogActions>
            <Button data-testid="cancel-btn" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={!formState.isValid} disableElevation>
              Import contacts
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default ImportContactsDialog
