import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { sanitizeName } from '@safe-global/utils/validation/names'
import {
  getMultiChainSafeId,
  getSafeId,
} from '@safe-global/views/features/spaces/components/SelectSafesOnboarding/utils/safeIds'
import { isMultiChainSafeItem } from '@/hooks/safes/isMultiChainSafeItem'
import { type AllSafeItems } from '@/hooks/safes'
import type { SafeLimit } from '@/utils/spaces'
import type { DraftSafe, WorkspaceDraft, WorkspaceDraftFields } from '../../../public/store/workspaceDraftSlice'
import type { AddAccountsFormValues } from '../../../hooks/addAccounts.types'
import { getSafesToName, hasAllNames, touchNames } from '../../NameAccounts/utils'
import useOnboardingSelection from '../../SelectSafesOnboarding/hooks/useOnboardingSelection'
import { getSelectedLeafKeys } from '../../SelectSafesOnboarding/utils/selection'
import { useSafeFromUrl } from './useSafeFromUrl'

type DraftChanges = Partial<WorkspaceDraftFields>

const toSafeKey = ({ chainId, address }: DraftSafe) => `${chainId}:${address}`

const fromSafeKey = (key: string): DraftSafe => {
  const separator = key.indexOf(':')
  return { chainId: key.slice(0, separator), address: key.slice(separator + 1) }
}

const toSafeNames = (names: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(names).map(([address, name]) => [address.toLowerCase(), sanitizeName(name)]))

type Args = {
  /** The ready draft the form starts from. */
  draft: WorkspaceDraft
  allSafes: AllSafeItems
  flaggedAddresses: Set<string>
  limit: SafeLimit
  advance: (changes: DraftChanges) => void
  retreat: (changes: DraftChanges) => void
}

const toForm = (draft: WorkspaceDraft): AddAccountsFormValues => ({
  selectedSafes: Object.fromEntries(draft.safes.map((safe) => [toSafeKey(safe), true])),
  names: draft.safeNames,
})

/** The picker keys of the linked Safe: its whole multichain group, the single Safe, or none when it is not listed. */
const linkedSafeKeys = (allSafes: AllSafeItems, safeFromUrl: string): string[] => {
  const linked = fromSafeKey(safeFromUrl)
  const group = allSafes.filter(isMultiChainSafeItem).find((item) => sameAddress(item.address, linked.address))
  if (group) return [getMultiChainSafeId(group), ...group.safes.map(getSafeId)]
  const single = allSafes.find(
    (item) =>
      !isMultiChainSafeItem(item) && item.chainId === linked.chainId && sameAddress(item.address, linked.address),
  )
  return single && !isMultiChainSafeItem(single) ? [getSafeId(single)] : []
}

/** The Safes step: pick Safes up to the plan's seats, then name the new ones, then save both to the draft. */
export const useSafesStepForm = ({ draft, allSafes, flaggedAddresses, limit, advance, retreat }: Args) => {
  const safeFromUrl = useSafeFromUrl()
  const [subStep, setSubStep] = useState<'select' | 'name'>('select')
  const [safesToName, setSafesToName] = useState<AllSafeItems>([])
  const formMethods = useForm<AddAccountsFormValues>({
    mode: 'onChange',
    defaultValues: toForm(draft),
  })
  const { control, setValue, getValues, handleSubmit } = formMethods

  // The picker list arrives with the owned Safes, after mount; a linked Safe outside it takes no seat.
  const isLinkPreselected = useRef(false)
  useEffect(() => {
    if (isLinkPreselected.current || draft.safes.length > 0 || !safeFromUrl) return
    const keys = linkedSafeKeys(allSafes, safeFromUrl)
    if (keys.length === 0) return
    isLinkPreselected.current = true
    const linkedSelection = Object.fromEntries(keys.map((key) => [key, true]))
    setValue('selectedSafes', { ...getValues('selectedSafes'), ...linkedSelection })
  }, [allSafes, draft.safes.length, safeFromUrl, getValues, setValue])

  const selection = useOnboardingSelection({ items: allSafes, control, setValue, flaggedAddresses, limit })

  const selectedSafes = useWatch({ control, name: 'selectedSafes' })
  const pickedSafes = useMemo(() => Array.from(getSelectedLeafKeys(selectedSafes ?? {}), fromSafeKey), [selectedSafes])

  const saveAndAdvance = (names: Record<string, string> = {}) =>
    advance({ safes: pickedSafes, safeNames: toSafeNames(names) })

  const onSubmit = handleSubmit(
    ({ names }) => {
      if (subStep === 'select') {
        const toName = getSafesToName(pickedSafes, allSafes, [])
        if (toName.length === 0) return saveAndAdvance(names)
        setSafesToName(toName)
        setSubStep('name')
        return
      }
      if (hasAllNames(names, safesToName)) saveAndAdvance(names)
      else touchNames(getValues, setValue, safesToName)
    },
    () => touchNames(getValues, setValue, safesToName),
  )

  const onBack = () => {
    if (subStep === 'name') setSubStep('select')
    else retreat({ safes: pickedSafes, safeNames: toSafeNames(getValues('names') ?? {}) })
  }

  const onSkip = () => advance({ safes: [], safeNames: {} })

  return {
    formMethods,
    selection,
    pickedSafes,
    isNameStep: subStep === 'name',
    safesToName,
    onSubmit,
    onBack,
    onSkip,
  }
}
