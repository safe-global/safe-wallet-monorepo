import { useState } from 'react'
import type { GasEstimate, Scenario } from '../sampleData'

export type GasParamName = keyof GasEstimate

const isPositiveNumber = (value: string) => value.trim() !== '' && Number(value) > 0

const validate = (draft: GasEstimate): Partial<Record<GasParamName, string>> => {
  const errors: Partial<Record<GasParamName, string>> = {}
  if (!/^\d+$/.test(draft.userNonce)) errors.userNonce = 'Enter a whole number'
  if (!/^\d+$/.test(draft.gasLimit) || Number(draft.gasLimit) < 21000) errors.gasLimit = 'At least 21000'
  if (!isPositiveNumber(draft.maxPriorityFeeGwei)) errors.maxPriorityFeeGwei = 'Enter an amount'
  if (!isPositiveNumber(draft.maxFeeGwei)) errors.maxFeeGwei = 'Enter an amount'
  else if (Number(draft.maxPriorityFeeGwei) > Number(draft.maxFeeGwei))
    errors.maxFeeGwei = 'Must be at least the priority fee'
  return errors
}

/** The signer-wallet gas settings: the estimate, the user's saved overrides and the open draft. */
export const useGasParams = (scenario: Scenario) => {
  const estimate = scenario.estimate
  const [saved, setSaved] = useState<GasEstimate>(estimate)
  const [draft, setDraft] = useState<GasEstimate | null>(scenario.startEditing ? estimate : null)
  const errors = draft ? validate(draft) : {}

  return {
    estimate,
    saved,
    draft,
    errors,
    isEdited: JSON.stringify(saved) !== JSON.stringify(estimate),
    startEditing: () => setDraft(saved),
    cancelEditing: () => setDraft(null),
    change: (name: GasParamName, value: string) => setDraft((d) => (d ? { ...d, [name]: value } : d)),
    reset: () => setDraft(estimate),
    save: () => {
      if (draft && Object.keys(validate(draft)).length === 0) {
        setSaved(draft)
        setDraft(null)
      }
    },
  }
}

export type GasParamsState = ReturnType<typeof useGasParams>
