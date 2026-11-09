import type { SpaceQueueCounts, SpaceQueueSafe } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SpaceQueueStatusOption } from '../../../store/spaceQueueApi'

type StatusOptionLabels = { menu: string; chip: string }

export const STATUS_OPTION_LABELS: Record<SpaceQueueStatusOption, StatusOptionLabels> = {
  execute: { menu: 'Execute', chip: 'Ready to execute' },
  sign: { menu: 'Sign', chip: 'Ready to sign' },
  blocked: { menu: 'Blocked', chip: 'Blocked' },
  waiting: { menu: 'Waiting', chip: 'Waiting on others' },
  conflicting: { menu: 'Conflicting', chip: 'Conflicting' },
  stale: { menu: 'Stale 7 days', chip: 'Stale 7 days' },
}

/** One Safe of the Safe filter: every chain it has a queue on, and its transactions matching the Status filter. */
export type SafeOption = { safeAddress: string; chainIds: string[]; count: number }

export const getSafeOptions = (safes: SpaceQueueCounts['safes']): SafeOption[] =>
  safes
    .reduce<SafeOption[]>((options, { safeAddress, chainId, count }) => {
      const option = options.find((other) => sameAddress(other.safeAddress, safeAddress))
      if (!option) return [...options, { safeAddress, chainIds: [chainId], count }]
      return options.map((other) =>
        other === option ? { ...other, chainIds: [...other.chainIds, chainId], count: other.count + count } : other,
      )
    }, [])
    .sort((a, b) => b.count - a.count)

const isSameSafe = (a: SpaceQueueSafe, b: SpaceQueueSafe): boolean =>
  a.chainId === b.chainId && sameAddress(a.safeAddress, b.safeAddress)

export const isSafeOptionSelected = (option: SafeOption, selected: SpaceQueueSafe[]): boolean =>
  option.chainIds.every((chainId) =>
    selected.some((safe) => isSameSafe(safe, { chainId, safeAddress: option.safeAddress })),
  )

/** The Safe selection with every chain of `option` added or, when it was selected, removed. */
export const toggleSafeOption = (option: SafeOption, selected: SpaceQueueSafe[]): SpaceQueueSafe[] =>
  isSafeOptionSelected(option, selected)
    ? selected.filter((safe) => !sameAddress(safe.safeAddress, option.safeAddress))
    : [
        ...selected.filter((safe) => !sameAddress(safe.safeAddress, option.safeAddress)),
        ...option.chainIds.map((chainId) => ({ chainId, safeAddress: option.safeAddress })),
      ]

/** The selected Safes once each, in selection order, for the Safe chip. */
export const getSelectedSafeAddresses = (selected: SpaceQueueSafe[]): SpaceQueueSafe[] =>
  selected.filter(
    (safe, index) => selected.findIndex((other) => sameAddress(other.safeAddress, safe.safeAddress)) === index,
  )
