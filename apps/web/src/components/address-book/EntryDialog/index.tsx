import { useState, type ReactElement, type BaseSyntheticEvent } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import AddressInput from '@/components/common/AddressInput'
import NameInput from '@/components/common/NameInput'
import useChainId from '@/hooks/useChainId'
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { useChain } from '@/hooks/useChains'
import { sanitizeName } from '@safe-global/utils/validation/names'
import { useUpsertWorkspaceSafeName, useWorkspaceAddressBookLabel, type AddressBookWriteScope } from '@/features/spaces'
import { EntryDialogView } from '@views/components/address-book/EntryDialog/EntryDialogView'

export type AddressEntry = {
  name: string
  address: string
}

function EntryDialog({
  handleClose,
  defaultValues = {
    name: '',
    address: '',
  },
  disableAddressInput = false,
  chainIds,
  currentChainId,
  scope = 'local',
  className,
  overlayClassName,
}: {
  handleClose: () => void
  defaultValues?: AddressEntry
  disableAddressInput?: boolean
  chainIds?: string[]
  currentChainId?: string
  scope?: AddressBookWriteScope
  /** Opened from inside another overlay? Pass `z-[var(--z-nested-overlay)]` to both of these. */
  className?: string
  overlayClassName?: string
}): ReactElement {
  const chainId = useChainId()
  const actualChainId = currentChainId ?? chainId
  const currentChain = useChain(actualChainId)
  const dispatch = useAppDispatch()
  const upsertWorkspaceName = useUpsertWorkspaceSafeName()
  const workspaceLabel = useWorkspaceAddressBookLabel()
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const methods = useForm<AddressEntry>({
    defaultValues,
    mode: 'onChange',
  })

  const { handleSubmit, formState } = methods

  const submitCallback = handleSubmit(async (data: AddressEntry) => {
    const targetChainIds = chainIds ?? [actualChainId]
    // Both address books store the same string, whichever branch runs.
    const entry = { ...data, name: sanitizeName(data.name) }

    if (scope === 'workspace') {
      setError(undefined)
      setIsSubmitting(true)
      const result = await upsertWorkspaceName({ ...entry, chainIds: targetChainIds })
      setIsSubmitting(false)
      if (result.error) return setError(result.error)
    } else {
      dispatch(upsertAddressBookEntries({ ...entry, chainIds: targetChainIds, notify: true }))
    }

    handleClose()
  })

  const onSubmit = (e: BaseSyntheticEvent) => {
    e.stopPropagation()
    // `submitCallback` is async, so a rejection here would escape as an unhandled rejection.
    submitCallback(e).catch(() => {
      setIsSubmitting(false)
      setError('Something went wrong. Please try again.')
    })
  }

  return (
    <FormProvider {...methods}>
      <EntryDialogView
        isEdit={Boolean(defaultValues.name)}
        isWorkspaceScope={scope === 'workspace'}
        workspaceLabel={workspaceLabel}
        hideChainIndicator={chainIds && chainIds.length > 1}
        chainId={chainIds?.[0]}
        modalClassName={className}
        modalOverlayClassName={overlayClassName}
        disableAddressInput={disableAddressInput}
        error={error}
        isValid={formState.isValid}
        isSubmitting={isSubmitting}
        onClose={handleClose}
        onSubmit={onSubmit}
        renderNameInput={(props) => <NameInput {...props} />}
        renderAddressInput={(props) => <AddressInput {...props} chain={currentChain} showPrefix={!!currentChainId} />}
      />
    </FormProvider>
  )
}

export default EntryDialog
