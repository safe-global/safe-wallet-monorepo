import { useState } from 'react'
import { toggleValue, type FilterSelection } from '@safe-global/views/components/common/Filters/filterState'

export function useFilterSelection(initial: FilterSelection = {}) {
  const [selection, setSelection] = useState<FilterSelection>(initial)

  return {
    selection,
    toggle: (id: string, value: string) =>
      setSelection((current) => ({ ...current, [id]: toggleValue(current[id] ?? [], value) })),
    clear: (id: string) => setSelection((current) => ({ ...current, [id]: [] })),
    reset: () => setSelection({}),
  }
}
