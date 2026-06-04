import { ContractVersions, KnownContracts, type SupportedNetworks } from '@gnosis.pm/zodiac'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'

/** Canonical names CGW returns for Zodiac Delay Modifier (case- and whitespace-insensitive). */
const DELAY_MODIFIER_NAMES = ['delay', 'delay modifier', 'zodiac delay modifier']

/**
 * Detect if a module is a Zodiac Delay Modifier (recovery module) without web3 provider.
 *
 * Layer 1: CGW API enriches known contracts with names — exact-match against canonical names.
 * Layer 2: Match address against known Zodiac Delay Modifier deployments per chain.
 */
export const isDelayModifier = (chainId: string, moduleAddress: string, moduleName?: string | null): boolean => {
  // Layer 1: API-provided name (exact, case-insensitive — substring match was too loose)
  if (moduleName && DELAY_MODIFIER_NAMES.includes(moduleName.trim().toLowerCase())) {
    return true
  }

  // Layer 2: Known Zodiac deployment addresses
  try {
    const chainContracts = ContractVersions[Number(chainId) as SupportedNetworks]
    const delayVersions = chainContracts?.[KnownContracts.DELAY]
    if (delayVersions) {
      return Object.values(delayVersions).some((addr) => sameAddress(addr, moduleAddress))
    }
  } catch {
    // Chain not in Zodiac's SupportedNetworks — skip
  }

  return false
}

/**
 * Whether the Safe has a confirmed recovery module installed — i.e. an active
 * (non-zero-address) module recognized as a Zodiac Delay Modifier. Shared by the
 * recovery scanner and the account-setup n/n gate so "recovery configured" means
 * the same thing in both.
 */
export const hasRecoverySetup = (
  chainId: string,
  modules: { value: string; name?: string | null }[] | null,
): boolean => {
  const activeModules = (modules ?? []).filter((m) => m.value !== ZERO_ADDRESS)
  return activeModules.some((m) => isDelayModifier(chainId, m.value, m.name))
}
