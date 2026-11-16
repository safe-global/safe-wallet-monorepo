import type { SpaceQueueCounts, SpaceQueueSafe } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { SPACE_QUEUE_FLAGS, SPACE_QUEUE_STATUSES, type SpaceQueueStatusOption } from '../../../hooks/useSpaceQueue'

const withCounts = (options: readonly SpaceQueueStatusOption[], counts?: SpaceQueueCounts) =>
  options.map((option) => [option, counts?.[option] ?? 0] as const)

/**
 * The counts of the Status filter options. The gateway counts statuses and flags apart while the filter
 * ANDs them, so one group's counts are hidden while an option of the other group is selected.
 */
export const getStatusCounts = (
  counts: SpaceQueueCounts | undefined,
  selected: SpaceQueueStatusOption[],
): Partial<Record<SpaceQueueStatusOption, number>> => {
  const isAnyFlagSelected = selected.some((option) => (SPACE_QUEUE_FLAGS as readonly string[]).includes(option))
  const isAnyStatusSelected = selected.some((option) => (SPACE_QUEUE_STATUSES as readonly string[]).includes(option))
  return Object.fromEntries([
    ...(isAnyFlagSelected ? [] : withCounts(SPACE_QUEUE_STATUSES, counts)),
    ...(isAnyStatusSelected ? [] : withCounts(SPACE_QUEUE_FLAGS, counts)),
  ])
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

/** The options of a count list, most transactions first. */
export const sortByCount = <T extends { count: number }>(options: T[]): T[] =>
  [...options].sort((a, b) => b.count - a.count)

/** The selection with `value` added or, when it was selected, removed. */
export const toggleValue = <T extends string>(
  value: T,
  selected: T[],
  isSame: (a: string, b: string) => boolean = (a, b) => a === b,
): T[] =>
  selected.some((other) => isSame(other, value))
    ? selected.filter((other) => !isSame(other, value))
    : [...selected, value]
