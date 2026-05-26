import { FormProvider, useForm } from 'react-hook-form'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { debounce } from 'lodash'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

import ContactsList from './ContactsList'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import SearchIcon from '@/public/images/common/search.svg'
import { useContactSearch } from '../useContactSearch'
import { createContactItems, flattenAddressBook } from '../utils'
import useChains from '@/hooks/useChains'
import { useAddressBooksUpsertAddressBookItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from '@/features/spaces'
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

      setIsSuccess(true)
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  })

  useEffect(() => {
    if (!isSuccess) return
    const timer = setTimeout(handleClose, SUCCESS_CLOSE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [isSuccess, handleClose])

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 top-0 left-0 w-screen h-screen max-w-none translate-x-0 translate-y-0 rounded-none bg-[var(--color-border-background)] overflow-y-auto flex items-center justify-center"
      >
        <div className="w-full max-w-[600px] px-4">
          <DialogHeader className="p-0 mb-6">
            <DialogTitle className="text-3xl font-bold">Import address book</DialogTitle>
          </DialogHeader>

          <Card className="border-0 p-0">
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

                <DialogFooter className="flex-row justify-end gap-2 p-4">
                  <Button variant="ghost" data-testid="cancel-btn" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={selectedCount === 0 || isSubmitting || isSuccess}>
                    {isSubmitting ? <Spinner className="size-4" /> : `Import contacts (${selectedCount})`}
                  </Button>
                </DialogFooter>
              </form>
            </FormProvider>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ImportAddressBookDialog
