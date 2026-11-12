import { useEffect, useRef } from 'react'
import type { WorkspaceDraft } from '@/features/spaces/store'
import { useWorkspaceDraft } from './useWorkspaceDraft'

/**
 * Fills a step's form from the draft once its owner is known. Only once: afterwards the form is the source of the
 * values, and the draft only receives them when the step is left.
 */
export const useFormFromDraft = <Values>(
  reset: (values: Values) => void,
  toValues: (draft: WorkspaceDraft) => Values,
) => {
  const { draft, isReady } = useWorkspaceDraft()
  const hasFilled = useRef(false)

  useEffect(() => {
    if (!isReady || hasFilled.current) return
    hasFilled.current = true
    reset(toValues(draft))
  }, [isReady, draft, reset, toValues])

  return isReady
}
