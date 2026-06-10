import { FormProvider, useForm } from 'react-hook-form'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { debounce } from 'lodash'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

import ContactsList from './ContactsList'
import UploadAddressBookTab from './UploadAddressBookTab'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import SearchIcon from '@/public/images/common/search.svg'
import { useContactSearch } from '../useContactSearch'
import { createContactItems, flattenAddressBook } from '../utils'
import useChains from '@/hooks/useChains'
import {
  useAddressBooksUpsertAddressBookItemsV1Mutation,
  type AddressBookItem,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId, useGetSpaceAddressBook } from '@/features/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
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

  const supportedChainIds = useMemo(() => configs.map((chain) => chain.chainId), [configs])
  const defaultTab = allContactItems.length > 0 ? 'local' : 'upload'

  const runImport = useCallback(
    async (items: AddressBookItem[]) => {
      setError(undefined)

      try {
        setIsSubmitting(true)

        const result = await upsertAddressBook({
          spaceId: spaceId ?? '',
          upsertAddressBookItemsDto: { items },
        })

        if (result.error) {
          setError('Something went wrong. Please try again.')
          dispatch(
            showNotification({
              message: 'Failed to import contacts. Please try again.',
              variant: 'error',
              groupKey: 'import-contacts-error',
            }),
          )
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
        setError('Something went wrong. Please try again.')
        dispatch(
          showNotification({
            message: 'Failed to import contacts. Please try again.',
            variant: 'error',
            groupKey: 'import-contacts-error',
          }),
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    [upsertAddressBook, spaceId, dispatch],
  )

  const onSubmit = handleSubmit((data) => runImport(createContactItems(data)))

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

        <Tabs defaultValue={defaultTab} onValueChange={() => setError(undefined)} className="gap-0">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="local">Local contacts</TabsTrigger>
            <TabsTrigger value="upload" data-testid="upload-file-tab">
              Upload file
            </TabsTrigger>
          </TabsList>

          <TabsContent value="local">
            <FormProvider {...formMethods}>
              <form onSubmit={onSubmit}>
                <div className="relative px-4 pt-4 mb-2">
                  <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="search-by-name"
                    placeholder="Search"
                    aria-label="Search contact list by name or address"
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <ContactsList contactItems={searchQuery ? filteredEntries : allContactItems} />

                {error && (
                  <Alert variant="destructive" className="mt-2 mx-4">
                    {error}
                  </Alert>
                )}

                <DialogFooter className="flex-row justify-end gap-2 p-4 border-t">
                  <Button variant="ghost" data-testid="cancel-btn" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Tooltip>
                    <TooltipTrigger render={<div className="inline-flex" />}>
                      <Button type="submit" disabled={selectedCount === 0 || isSubmitting || isSuccess}>
                        {isSubmitting ? <Spinner className="size-4" /> : `Import contacts (${selectedCount})`}
                      </Button>
                    </TooltipTrigger>
                    {hasNoImportableContacts && <TooltipContent>You have no new contacts to import.</TooltipContent>}
                  </Tooltip>
                </DialogFooter>
              </form>
            </FormProvider>
          </TabsContent>

          <TabsContent value="upload">
            <UploadAddressBookTab
              supportedChainIds={supportedChainIds}
              onImport={runImport}
              onCancel={handleClose}
              isSubmitting={isSubmitting}
              isSuccess={isSuccess}
              submitError={error}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default ImportAddressBookDialog
