import { FormProvider, useForm } from 'react-hook-form'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { debounce } from 'lodash'

import { Alert } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SearchInput } from '@/components/ui/search-input'
import DialogActions from '@/components/common/DialogActions'

import ContactsList from './ContactsList'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import { useContactSearch } from '../useContactSearch'
import { createContactItems, flattenAddressBook } from '../utils'
import useChains from '@/hooks/useChains'
import { useAddressBooksUpsertAddressBookItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId, useGetSpaceAddressBook } from '@/features/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

export type ImportContactsFormValues = {
  contacts: Record<string, string | undefined>
}

const SUCCESS_CLOSE_DELAY_MS = 500

const ImportAddressBookDialog = ({ handleClose }: { handleClose: () => void }) => {
  const [error, setError] = useState<string>()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const handleCloseRef = useRef(handleClose)
  const { configs } = useChains()
  const dispatch = useAppDispatch()
  const spaceId = useCurrentSpaceId()
  const [upsertAddressBook] = useAddressBooksUpsertAddressBookItemsV1Mutation()

  const allAddressBooks = useAllAddressBooks()
  const spaceContacts = useGetSpaceAddressBook()
  const allContactItems = useMemo(
    () =>
      flattenAddressBook(allAddressBooks).filter((contactItem) =>
        configs.some((chain) => chain.chainId === contactItem.chainId),
      ),
    [allAddressBooks, configs],
  )

  const hasNoImportableContacts = useMemo(
    () =>
      allContactItems.length === 0 ||
      allContactItems.every((contactItem) =>
        spaceContacts.some((spaceContact) => sameAddress(spaceContact.address, contactItem.address)),
      ),
    [allContactItems, spaceContacts],
  )

  useEffect(() => {
    handleCloseRef.current = handleClose
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(debounce(setSearchQuery, 300), [])

  useEffect(() => () => handleSearch.cancel(), [handleSearch])
  const filteredEntries = useContactSearch(allContactItems, searchQuery)

  const formMethods = useForm<ImportContactsFormValues>({
    defaultValues: { contacts: {} },
  })

  const { handleSubmit, watch } = formMethods

  const selectedContacts = watch('contacts')
  const selectedCount = Object.values(selectedContacts).filter(Boolean).length

  const onSubmit = handleSubmit(async (data) => {
    setError(undefined)
    const contactItems = createContactItems(data)

    try {
      setIsSubmitting(true)

      const result = await upsertAddressBook({
        spaceId: spaceId ?? '',
        upsertAddressBookItemsDto: { items: contactItems },
      })

      if (result.error) {
        const message = getRtkQueryErrorMessage(result.error as FetchBaseQueryError | SerializedError)
        setError(message)
        dispatch(showNotification({ message, variant: 'error', groupKey: 'import-contacts-error' }))
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

      setIsSuccess(true)
    } catch (e) {
      const message = getRtkQueryErrorMessage(e as FetchBaseQueryError | SerializedError)
      setError(message)
      dispatch(showNotification({ message, variant: 'error', groupKey: 'import-contacts-error' }))
    } finally {
      setIsSubmitting(false)
    }
  })

  useEffect(() => {
    if (!isSuccess) return
    const timer = setTimeout(() => handleCloseRef.current(), SUCCESS_CLOSE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [isSuccess])

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="p-0">
        <DialogHeader className="border-b">
          <DialogTitle className="font-bold text-xl">Import address book</DialogTitle>
        </DialogHeader>

        <FormProvider {...formMethods}>
          <form onSubmit={onSubmit}>
            <div className="px-4 pt-4 mb-2">
              <SearchInput
                id="search-by-name"
                placeholder="Search"
                aria-label="Search contact list by name or address"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <ContactsList contactItems={searchQuery ? filteredEntries : allContactItems} />

            <DialogFooter className="flex-col items-stretch gap-2 p-4 border-t">
              {error && <Alert variant="destructive">{error}</Alert>}

              <DialogActions
                onCancel={handleClose}
                cancelTestId="cancel-btn"
                confirmLabel={`Import contacts (${selectedCount})`}
                confirmType="submit"
                confirmLoading={isSubmitting}
                confirmDisabled={selectedCount === 0 || isSuccess}
                confirmTooltip={hasNoImportableContacts ? 'You have no new contacts to import.' : undefined}
              />
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}

export default ImportAddressBookDialog
