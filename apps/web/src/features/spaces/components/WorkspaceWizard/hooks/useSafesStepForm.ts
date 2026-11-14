import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { sanitizeName } from '@safe-global/utils/validation/names'
import {
  getMultiChainSafeId,
  getSafeId,
} from '@safe-global/views/features/spaces/components/SelectSafesOnboarding/utils/safeIds'
import { isMultiChainSafeItem, type AllSafeItems } from '@/hooks/safes'
import type { SafeLimit } from '@/utils/spaces'
import type { DraftSafe, WorkspaceDraft, WorkspaceDraftFields } from '@/features/spaces/store'
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

const toForm = (draft: WorkspaceDraft, safeFromUrl: string | undefined): AddAccountsFormValues => {
  const keys = draft.safes.length > 0 ? draft.safes.map(toSafeKey) : safeFromUrl ? [safeFromUrl] : []
  return { selectedSafes: Object.fromEntries(keys.map((key) => [key, true])), names: draft.safeNames }
}

/** The Safes step: pick Safes up to the plan's seats, then name the new ones, then save both to the draft. */
export const useSafesStepForm = ({ draft, allSafes, flaggedAddresses, limit, advance, retreat }: Args) => {
  const safeFromUrl = useSafeFromUrl()
  const [subStep, setSubStep] = useState<'select' | 'name'>('select')
  const [safesToName, setSafesToName] = useState<AllSafeItems>([])
  const formMethods = useForm<AddAccountsFormValues>({
    mode: 'onChange',
    defaultValues: toForm(draft, safeFromUrl),
  })
  const { control, setValue, getValues, handleSubmit } = formMethods

  // The linked Safe's multichain group arrives with the owned Safes, after mount; select the whole group once.
  const isGroupPreselected = useRef(false)
  useEffect(() => {
    if (isGroupPreselected.current || draft.safes.length > 0 || !safeFromUrl) return
    const { address } = fromSafeKey(safeFromUrl)
    const group = allSafes.filter(isMultiChainSafeItem).find((item) => sameAddress(item.address, address))
    if (!group) return
    isGroupPreselected.current = true
    const groupKeys = [getMultiChainSafeId(group), ...group.safes.map(getSafeId)]
    const groupSelection = Object.fromEntries(groupKeys.map((key) => [key, true]))
    setValue('selectedSafes', { ...getValues('selectedSafes'), ...groupSelection })
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
