import { FormProvider, useForm } from 'react-hook-form'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { debounce } from 'lodash'

import ContactsList from './ContactsList'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import { useContactSearch } from '../useContactSearch'
import { createContactItems, flattenAddressBook } from '../utils'
import useChains from '@/hooks/useChains'
import { useAddressBooksUpsertAddressBookItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId, useGetSpaceAddressBook, useWorkspaceAddressBookLabel } from '@/features/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getImportSuccessMessage } from '@/utils/addressBookNotifications'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'
import { ImportAddressBookDialogView } from '@views/features/spaces/components/SpaceAddressBook/Import/ImportAddressBookDialogView'

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
  const workspaceAddressBookLabel = useWorkspaceAddressBookLabel()
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

      if (isElevationRequiredError(result.error)) return
      if (result.error) {
        setError(getRtkQueryErrorMessage(result.error as FetchBaseQueryError | SerializedError))
        return
      }

      const contactCount = contactItems.length
      const networkCount = new Set(contactItems.flatMap((item) => item.chainIds)).size
      const successMessage = getImportSuccessMessage({
        count: contactCount,
        networkCount,
        bookLabel: workspaceAddressBookLabel,
      })

      dispatch(
        showNotification({
          message: successMessage,
          variant: 'success',
          groupKey: 'import-contacts-success',
        }),
      )

      trackEvent(SPACE_EVENTS.IMPORT_ADDRESS_BOOK_SUBMIT, { [MixpanelEventParams.ENTRY_COUNT]: contactCount })

      setIsSuccess(true)
    } catch (e) {
      setError(getRtkQueryErrorMessage(e as FetchBaseQueryError | SerializedError))
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
    <FormProvider {...formMethods}>
      <ImportAddressBookDialogView
        onClose={handleClose}
        onSubmit={onSubmit}
        onSearch={handleSearch}
        contactsList={<ContactsList contactItems={searchQuery ? filteredEntries : allContactItems} />}
        error={error}
        selectedCount={selectedCount}
        isSubmitting={isSubmitting}
        isSuccess={isSuccess}
        hasNoImportableContacts={hasNoImportableContacts}
      />
    </FormProvider>
  )
}

export default ImportAddressBookDialog
