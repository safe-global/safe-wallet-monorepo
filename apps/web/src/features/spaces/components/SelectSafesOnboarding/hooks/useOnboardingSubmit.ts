import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { type AllSafeItems, flattenSafeItems } from '@/hooks/safes'
import type { AddAccountsFormValues } from '@/features/spaces/components/AddAccounts/index'
import { useSpaceSafesCreateV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { useSpaceSafes } from '@/features/spaces/hooks/useSpaceSafes'

const getSelectedSafes = (safes: AddAccountsFormValues['selectedSafes'], spaceSafes: AllSafeItems) => {
  const flatSafeItems = flattenSafeItems(spaceSafes)

  return Object.entries(safes).filter(
    ([key, isSelected]) =>
      isSelected &&
      !key.startsWith('multichain_') &&
      !flatSafeItems.some((spaceSafe) => {
        const [chainId, address] = key.split(':')
        return spaceSafe.address === address && spaceSafe.chainId === chainId
      }),
  )
}

const useOnboardingSubmit = (spaceId: string | undefined, onSuccess: () => void) => {
  const dispatch = useAppDispatch()
  const { allSafes: spaceSafes } = useSpaceSafes()
  const [addSafesToSpace] = useSpaceSafesCreateV1Mutation()

  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formMethods = useForm<AddAccountsFormValues>({
    mode: 'onChange',
    defaultValues: {
      selectedSafes: {},
    },
  })

  const { handleSubmit, watch } = formMethods
  const selectedSafes = watch('selectedSafes')
  const selectedSafesLength = getSelectedSafes(selectedSafes, spaceSafes).length

  const onSubmit = handleSubmit(async (data) => {
    if (!spaceId) return

    setError(undefined)
    setIsSubmitting(true)

    try {
      trackEvent({ ...SPACE_EVENTS.ADD_ACCOUNTS })

      const safesToAdd = getSelectedSafes(data.selectedSafes, spaceSafes).map(([key]) => {
        const [chainId, address] = key.split(':')
        return { chainId, address }
      })

      const result = await addSafesToSpace({
        spaceId: Number(spaceId),
        createSpaceSafesDto: { safes: safesToAdd },
      })

      if (result.error) {
        // @ts-ignore
        setError(result.error?.data?.message || 'Something went wrong adding one or more Safe Accounts.')
        setIsSubmitting(false)
        return
      }

      dispatch(
        showNotification({
          message: 'Added Safe Account(s) to space',
          variant: 'success',
          groupKey: 'add-safe-account-success',
        }),
      )

      onSuccess()
    } catch {
      setError('Something went wrong adding Safe Accounts. Please try again.')
      setIsSubmitting(false)
    }
  })

  return {
    formMethods,
    onSubmit,
    selectedSafesLength,
    error,
    isSubmitting,
  }
}

export default useOnboardingSubmit
