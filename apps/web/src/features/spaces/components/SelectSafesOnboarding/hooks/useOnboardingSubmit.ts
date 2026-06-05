import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/router'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { parsePrefixedAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import { isValidAddress } from '@safe-global/utils/utils/validation'
import { type AllSafeItems, flattenSafeItems, isMultiChainSafeItem } from '@/hooks/safes'
import type { AddAccountsFormValues } from '@/features/spaces/hooks/useSelectAll.types'
import {
  useSpaceSafesCreateV1Mutation,
  useSpaceSafesDeleteV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import useChains from '@/hooks/useChains'
import { useSpaceSafes } from '@/features/spaces/hooks/useSpaceSafes'
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import { getSafeId, getMultiChainSafeId } from '../components/SafeCard'
import { MULTICHAIN_SAFE_KEY_PREFIX } from '../constants'

// URL safe-param prefix can be either numeric chainId or shortName ("1:" or "eth:").
const safeParamToFormKey = (safeParam: string, chains: Chain[]): string | undefined => {
  const { prefix, address } = parsePrefixedAddress(safeParam)
  if (!address || !prefix || !isValidAddress(address)) {
    return undefined
  }

  if (/^\d+$/.test(prefix)) {
    return `${prefix}:${address}`
  }

  const chain = chains.find((c) => c.shortName.toLowerCase() === prefix.toLowerCase())
  if (!chain) {
    return undefined
  }

  return `${chain.chainId}:${address}`
}

const parseSafeKey = (key: string) => {
  const [chainId, address] = key.split(':')
  return { chainId, address }
}

const EMPTY_ALL_SAFES: AllSafeItems = []

const useOnboardingSubmit = (
  spaceId: string | undefined,
  onSuccess: () => void,
  allSafes: AllSafeItems = EMPTY_ALL_SAFES,
) => {
  const router = useRouter()
  const { configs: chains } = useChains()
  const safeFromUrl = useSafeQueryParam() || undefined
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

  // Tracks URL pre-selection progress: idle → tentative (single-chain selected, awaiting
  // more owned safes to load) → done (multichain group resolved, or param invalid/unresolvable).
  const urlSelectionState = useRef<'idle' | 'tentative' | 'done'>('idle')

  useEffect(() => {
    if (urlSelectionState.current === 'done' || !safeFromUrl || !router.isReady || spaceSafes.length > 0) return

    const formKey = safeParamToFormKey(safeFromUrl, chains)
    if (!formKey) {
      const { prefix } = parsePrefixedAddress(safeFromUrl)
      if (prefix && !/^\d+$/.test(prefix) && chains.length === 0) return
      urlSelectionState.current = 'done'
      return
    }

    const { address } = parsePrefixedAddress(safeFromUrl)
    const multiChainGroup = allSafes.find((item) => isMultiChainSafeItem(item) && sameAddress(item.address, address))

    if (multiChainGroup && isMultiChainSafeItem(multiChainGroup)) {
      const selected: Record<string, boolean> = {}
      selected[getMultiChainSafeId(multiChainGroup)] = true
      for (const subSafe of multiChainGroup.safes) {
        selected[getSafeId(subSafe)] = true
      }
      urlSelectionState.current = 'done'
      reset({ selectedSafes: selected })
    } else if (urlSelectionState.current === 'idle') {
      // Select the single key once. Don't finalize — owned safes from other
      // chains may still be loading, which could form a multichain group later.
      urlSelectionState.current = 'tentative'
      reset({ selectedSafes: { [formKey]: true } })
    }
  }, [safeFromUrl, router.isReady, spaceSafes, reset, chains, allSafes])
  const selectedSafes = watch('selectedSafes')
  const selectedSafesLength = Object.entries(selectedSafes).filter(
    ([key, isSelected]) => isSelected && !key.startsWith(MULTICHAIN_SAFE_KEY_PREFIX),
  ).length

  const addNewSafes = async (selectedSafes: AddAccountsFormValues['selectedSafes'], spaceIdNum: number) => {
    const flatSpaceSafes = flattenSafeItems(spaceSafes)

    const safesToAdd = Object.entries(selectedSafes)
      .filter(
        ([key, isSelected]) =>
          isSelected &&
          !key.startsWith(MULTICHAIN_SAFE_KEY_PREFIX) &&
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

  const processSelectedSafes = async (selectedSafes: AddAccountsFormValues['selectedSafes'], spaceIdNum: number) => {
    await addNewSafes(selectedSafes, spaceIdNum)
    await removeUnselectedSafes(selectedSafes, spaceIdNum)
  }

  const onSubmit = handleSubmit(async (data) => {
    if (!spaceId) return

    setError(undefined)
    setIsSubmitting(true)

    try {
      trackEvent({ ...SPACE_EVENTS.ADD_ACCOUNTS })
      await processSelectedSafes(data.selectedSafes, Number(spaceId))

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
