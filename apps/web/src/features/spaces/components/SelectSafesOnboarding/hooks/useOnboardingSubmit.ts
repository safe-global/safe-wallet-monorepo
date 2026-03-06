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
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
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

  const addNewSafes = async (selectedSafes: AddAccountsFormValues['selectedSafes'], spaceIdNum: number) => {
    const flatSpaceSafes = flattenSafeItems(spaceSafes)

    const safesToAdd = Object.entries(selectedSafes)
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

    if (safesToAdd.length === 0) return

    const result = await addSafesToSpace({
      spaceId: spaceIdNum,
      createSpaceSafesDto: { safes: safesToAdd },
    })
    if (result.error) {
      throw new Error(getRtkQueryErrorMessage(result.error))
    }
  }

  const removeUnselectedSafes = async (selectedSafes: AddAccountsFormValues['selectedSafes'], spaceIdNum: number) => {
    const flatSpaceSafes = flattenSafeItems(spaceSafes)

    const safesToRemove = flatSpaceSafes
      .filter((s) => {
        const key = getSafeId(s)
        return selectedSafes[key] === false || !(key in selectedSafes)
      })
      .map((s) => ({ chainId: s.chainId, address: s.address }))

    if (safesToRemove.length === 0) return

    const result = await removeSafesFromSpace({
      spaceId: spaceIdNum,
      deleteSpaceSafesDto: { safes: safesToRemove },
    })
    if (result.error) {
      throw new Error(getRtkQueryErrorMessage(result.error))
    }
  }

  const onSubmit = handleSubmit(async (data) => {
    if (!spaceId) return

    setError(undefined)
    setIsSubmitting(true)

    try {
      trackEvent({ ...SPACE_EVENTS.ADD_ACCOUNTS })

      const spaceIdNum = Number(spaceId)

      await addNewSafes(data.selectedSafes, spaceIdNum)
      await removeUnselectedSafes(data.selectedSafes, spaceIdNum)

      dispatch(
        showNotification({
          message: 'Updated Safe Account(s) in space',
          variant: 'success',
          groupKey: 'update-safe-accounts-success',
        }),
      )

      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong updating Safe Accounts. Please try again.')
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
