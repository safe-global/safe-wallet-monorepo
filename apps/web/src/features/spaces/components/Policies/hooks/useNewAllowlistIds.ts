import { useCallback, useEffect, useRef, useState } from 'react'
import { isAllowlistPolicy, type Policy } from '@safe-global/views/features/spaces/components/Policies/types'

const NONE: ReadonlySet<string> = new Set()

/** Allowlists that turn up in a refetch while the page is open, so their drawer can show the "now active" banner. */
export const useNewAllowlistIds = (
  policies: Policy[],
  isSettled: boolean,
): { newIds: ReadonlySet<string>; dismiss: (id: string) => void } => {
  const previous = useRef<Set<string> | null>(null)
  const [newIds, setNewIds] = useState<ReadonlySet<string>>(NONE)

  useEffect(() => {
    // A load or an error starts over, so a Space switch or a recovered request is not read as new rows.
    if (!isSettled) {
      previous.current = null
      setNewIds(NONE)
      return
    }

    const ids = new Set(policies.filter(isAllowlistPolicy).map((policy) => policy.id))
    const before = previous.current
    previous.current = ids
    if (!before) return

    const added = [...ids].filter((id) => !before.has(id))
    if (added.length > 0) setNewIds((current) => new Set([...current, ...added]))
  }, [policies, isSettled])

  const dismiss = useCallback(
    (id: string) =>
      setNewIds((current) => {
        if (!current.has(id)) return current
        const next = new Set(current)
        next.delete(id)
        return next
      }),
    [],
  )

  return { newIds, dismiss }
}
