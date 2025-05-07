import { FormProvider, useForm } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  DialogActions,
  DialogContent,
  InputAdornment,
  SvgIcon,
  TextField,
  Typography,
} from '@mui/material'

import ModalDialog from '@/components/common/ModalDialog'
import ContactsList from '@/features/spaces/components/SpaceAddressBook/Import/ContactsList'
import React, { useCallback, useMemo, useState } from 'react'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import css from '@/features/spaces/components/AddAccounts/styles.module.css'
import SearchIcon from '@/public/images/common/search.svg'
import { debounce } from 'lodash'
import { useContactSearch } from '@/features/spaces/components/SpaceAddressBook/useContactSearch'
import { createContactItems, flattenAddressBook } from '@/features/spaces/components/SpaceAddressBook/utils'
import useChains from '@/hooks/useChains'
import { useAddressBooksUpsertAddressBookItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

export type ImportContactsFormValues = {
  contacts: Record<string, string | undefined> // e.g. "1:0x123": "Alice"
}

const ImportAddressBookDialog = ({ handleClose }: { handleClose: () => void }) => {
  const [error, setError] = useState<string>()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { configs } = useChains()
  const dispatch = useAppDispatch()
  const spaceId = useCurrentSpaceId()
  const [upsertAddressBook] = useAddressBooksUpsertAddressBookItemsV1Mutation()

  const allAddressBooks = useAllAddressBooks()
  const allContactItems = useMemo(
    () =>
      flattenAddressBook(allAddressBooks).filter((contactItem) =>
        configs.some((chain) => chain.chainId === contactItem.chainId),
      ),
    [allAddressBooks, configs],
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(debounce(setSearchQuery, 300), [])
  const filteredEntries = useContactSearch(allContactItems, searchQuery)

  const formMethods = useForm<ImportContactsFormValues>({
    mode: 'onChange',
    defaultValues: {
      contacts: {},
    },
  })

  const { handleSubmit, formState, watch } = formMethods

  const selectedContacts = watch('contacts')
  const selectedContactsLength = Object.values(selectedContacts).filter(Boolean)

  const onSubmit = handleSubmit(async (data) => {
    setError(undefined)
    const contactItems = createContactItems(data)

    try {
      setIsSubmitting(true)

      const result = await upsertAddressBook({
        spaceId: Number(spaceId),
        upsertAddressBookItemsDto: { items: contactItems },
      })

      if (result.error) {
        setError('Something went wrong. Please try again.')
        return
      }

      dispatch(
        showNotification({
          message: `Imported contact(s)`,
          variant: 'success',
          groupKey: 'import-contacts-success',
        }),
      )

      trackEvent(SPACE_EVENTS.IMPORT_ADDRESS_BOOK_SUBMIT)

      handleClose()
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
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

                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}

                <DialogActions>
                  <Button data-testid="cancel-btn" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!formState.isValid || isSubmitting}
                    disableElevation
                  >
                    {isSubmitting ? (
                      <CircularProgress size={20} />
                    ) : (
                      `Import contacts (${selectedContactsLength.length})`
                    )}
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

export default ImportAddressBookDialog
