import type { SpaceQueueCounts } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { QueueToolbarProps } from '@safe-global/views/features/spaces/components/SpaceQueue/QueueFilters/QueueToolbar'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import useChains from '@/hooks/useChains'
import {
  NO_SPACE_QUEUE_FILTERS,
  SPACE_QUEUE_FLAGS,
  SPACE_QUEUE_STATUSES,
  type SpaceQueueFilters,
} from '../../../store/spaceQueueApi'
import { useSignerNameResolver } from './useSignerNameResolver'
import {
  getSafeOptions,
  getSelectedSafeAddresses,
  getStatusCounts,
  isSafeOptionSelected,
  sortByCount,
  toggleSafeOption,
  toggleValue,
} from './utils'

/** The options, names and counts the queue toolbar shows for the filters in use */
export const useQueueFilterOptions = (
  counts: SpaceQueueCounts | undefined,
  filters: SpaceQueueFilters,
  onFiltersChange: (filters: SpaceQueueFilters) => void,
): Omit<QueueToolbarProps, 'action'> => {
  const { configs } = useChains()
  const resolveSafeName = useSafeNameResolver()
  const chainIds = (counts?.chains ?? []).map(({ chainId }) => chainId)
  const resolveSignerName = useSignerNameResolver(chainIds)
  const getChain = (chainId: string) => configs.find((chain) => chain.chainId === chainId)
  const safeOptions = getSafeOptions(counts?.safes ?? [])

  return {
    status: {
      statuses: SPACE_QUEUE_STATUSES,
      flags: SPACE_QUEUE_FLAGS,
      counts: getStatusCounts(counts, filters.statuses),
      selected: filters.statuses,
      onToggle: (option) => onFiltersChange({ ...filters, statuses: toggleValue(option, filters.statuses) }),
    },
    safe: {
      options: safeOptions.map((option) => ({
        safeAddress: option.safeAddress,
        name: resolveSafeName(option.safeAddress, option.chainIds[0]),
        count: option.count,
        checked: isSafeOptionSelected(option, filters.safes),
      })),
      onToggle: (safeAddress) => {
        const option = safeOptions.find((other) => other.safeAddress === safeAddress)
        if (option) onFiltersChange({ ...filters, safes: toggleSafeOption(option, filters.safes) })
      },
    },
    network: {
      options: sortByCount(counts?.chains ?? []).map(({ chainId, count }) => ({
        chainId,
        name: getChain(chainId)?.chainName ?? chainId,
        logoUri: getChain(chainId)?.chainLogoUri,
        count,
        checked: filters.chainIds.includes(chainId),
      })),
      onToggle: (chainId) => onFiltersChange({ ...filters, chainIds: toggleValue(chainId, filters.chainIds) }),
    },
    signer: {
      options: sortByCount(counts?.signers ?? []).map(({ address, count }) => ({
        address,
        name: resolveSignerName(address),
        count,
        checked: filters.signers.some((other) => sameAddress(other, address)),
      })),
      onToggle: (address) =>
        onFiltersChange({ ...filters, signers: toggleValue(address, filters.signers, sameAddress) }),
    },
    chips: {
      safes: getSelectedSafeAddresses(filters.safes).map(({ safeAddress, chainId }) => ({
        safeAddress,
        name: resolveSafeName(safeAddress, chainId),
      })),
      statuses: filters.statuses,
      networkNames: filters.chainIds.map((chainId) => getChain(chainId)?.chainName ?? chainId),
      signerNames: filters.signers.map(resolveSignerName),
      onRemove: (filter) => onFiltersChange({ ...filters, [filter]: [] }),
      onClear: () => onFiltersChange(NO_SPACE_QUEUE_FILTERS),
    },
  }
}
