import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { flattenSafeItems, isMultiChainSafeItem } from '@/hooks/safes'
import type { AddAccountsFormValues } from '@/features/spaces/components/AddAccounts/index'
import {
  useSpaceSafesCreateV1Mutation,
  useSpaceSafesDeleteV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { useSpaceSafes } from '@/features/spaces/hooks/useSpaceSafes'
import { getSafeId, getMultiChainSafeId } from '../components/SafeCard'

const parseSafeKey = (key: string) => {
  const [chainId, address] = key.split(':')
  return { chainId, address }
}

const useOnboardingSubmit = (spaceId: string | undefined, onSuccess: () => void) => {
  const dispatch = useAppDispatch()
  const { allSafes: spaceSafes } = useSpaceSafes()
  const [addSafesToSpace] = useSpaceSafesCreateV1Mutation()
  const [removeSafesFromSpace] = useSpaceSafesDeleteV1Mutation()

  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formMethods = useForm<AddAccountsFormValues>({
    mode: 'onChange',
    defaultValues: {
      selectedSafes: {},
    },
  })

  const { handleSubmit, watch, reset } = formMethods

  const hasInitialized = useRef(false)

  useEffect(() => {
    if (hasInitialized.current || spaceSafes.length === 0) return
    hasInitialized.current = true

    const selected: Record<string, boolean> = {}
    for (const safe of spaceSafes) {
      if (isMultiChainSafeItem(safe)) {
        selected[getMultiChainSafeId(safe)] = true
        for (const subSafe of safe.safes) {
          selected[getSafeId(subSafe)] = true
        }
      } else {
        selected[getSafeId(safe)] = true
      }
    }
    reset({ selectedSafes: selected })
  }, [spaceSafes, reset])
  const selectedSafes = watch('selectedSafes')
  const selectedSafesLength = Object.entries(selectedSafes).filter(
    ([key, isSelected]) => isSelected && !key.startsWith('multichain_'),
  ).length

  const onSubmit = handleSubmit(async (data) => {
    if (!spaceId) return

    setError(undefined)
    setIsSubmitting(true)

    try {
      trackEvent({ ...SPACE_EVENTS.ADD_ACCOUNTS })

      const flatSpaceSafes = flattenSafeItems(spaceSafes)
      const spaceIdNum = Number(spaceId)

      const safesToAdd = Object.entries(data.selectedSafes)
        .filter(
          ([key, isSelected]) =>
            isSelected &&
            !key.startsWith('multichain_') &&
            !flatSpaceSafes.some((s) => {
              const { chainId, address } = parseSafeKey(key)
              return s.address === address && s.chainId === chainId
            }),
        )
        .map(([key]) => parseSafeKey(key))

      const safesToRemove = flatSpaceSafes
        .filter((s) => {
          const key = getSafeId(s)
          return data.selectedSafes[key] === false || !(key in data.selectedSafes)
        })
        .map((s) => ({ chainId: s.chainId, address: s.address }))

      if (safesToAdd.length > 0) {
        const addResult = await addSafesToSpace({
          spaceId: spaceIdNum,
          createSpaceSafesDto: { safes: safesToAdd },
        })
        if (addResult.error) {
          // @ts-ignore
          setError(addResult.error?.data?.message || 'Something went wrong adding one or more Safe Accounts.')
          setIsSubmitting(false)
          return
        }
      }

      if (safesToRemove.length > 0) {
        const removeResult = await removeSafesFromSpace({
          spaceId: spaceIdNum,
          deleteSpaceSafesDto: { safes: safesToRemove },
        })
        if (removeResult.error) {
          // @ts-ignore
          setError(removeResult.error?.data?.message || 'Something went wrong removing one or more Safe Accounts.')
          setIsSubmitting(false)
          return
        }
      }

      dispatch(
        showNotification({
          message: 'Updated Safe Account(s) in space',
          variant: 'success',
          groupKey: 'update-safe-accounts-success',
        }),
      )

      onSuccess()
    } catch {
      setError('Something went wrong updating Safe Accounts. Please try again.')
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
