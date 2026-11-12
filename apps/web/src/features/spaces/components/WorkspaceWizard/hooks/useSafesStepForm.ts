import { useCallback, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { sanitizeName } from '@safe-global/utils/validation/names'
import type { AllSafeItems } from '@/hooks/safes'
import type { SafeLimit } from '@/utils/spaces'
import type { DraftSafe, WorkspaceDraft, WorkspaceDraftFields } from '@/features/spaces/store'
import type { AddAccountsFormValues } from '../../../hooks/addAccounts.types'
import { getSafesToName, hasAllNames, touchNames } from '../../NameAccounts/utils'
import useOnboardingSelection from '../../SelectSafesOnboarding/hooks/useOnboardingSelection'
import { getSelectedLeafKeys } from '../../SelectSafesOnboarding/utils/selection'
import { useFormFromDraft } from './useFormFromDraft'
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
  allSafes: AllSafeItems
  flaggedAddresses: Set<string>
  limit: SafeLimit
  advance: (changes: DraftChanges) => void
  retreat: (changes: DraftChanges) => void
}

/** The Safes step: pick Safes up to the plan's seats, then name the new ones, then save both to the draft. */
export const useSafesStepForm = ({ allSafes, flaggedAddresses, limit, advance, retreat }: Args) => {
  const safeFromUrl = useSafeFromUrl()
  const [subStep, setSubStep] = useState<'select' | 'name'>('select')
  const [safesToName, setSafesToName] = useState<AllSafeItems>([])
  const formMethods = useForm<AddAccountsFormValues>({
    mode: 'onChange',
    defaultValues: { selectedSafes: {}, names: {} },
  })
  const { control, setValue, getValues, reset, handleSubmit } = formMethods

  const toForm = useCallback(
    (draft: WorkspaceDraft): AddAccountsFormValues => {
      const keys = draft.safes.length > 0 ? draft.safes.map(toSafeKey) : safeFromUrl ? [safeFromUrl] : []
      return { selectedSafes: Object.fromEntries(keys.map((key) => [key, true])), names: draft.safeNames }
    },
    [safeFromUrl],
  )
  const isReady = useFormFromDraft(reset, toForm)
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
    isReady,
    onSubmit,
    onBack,
    onSkip,
  }
}
