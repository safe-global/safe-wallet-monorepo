import type { SafeAccountEntry, SafeAccountGroup, SafeAccountOption } from './types'

// Checksum-agnostic on purpose: we do not control the casing the API and address book supply, and
// `isAddress` would reject a valid lower-cased address and silently blank the trigger.
const ADDRESS_FORMAT = /^0x[0-9a-fA-F]{40}$/
const CHAIN_ID_FORMAT = /^\d+$/

/** Same format as the topbar selector's value. */
export const buildSafeAccountId = (chainId: string, address: string): string => `${chainId}:${address}`

export const parseSafeAccountId = (id: string): { chainId: string; address: string } | undefined => {
  const [chainId, address, ...rest] = id.split(':')

  if (rest.length > 0 || !CHAIN_ID_FORMAT.test(chainId ?? '') || !ADDRESS_FORMAT.test(address ?? '')) {
    return undefined
  }

  return { chainId, address }
}

const chainLabel = (option: SafeAccountOption) => option.chain?.chainName ?? option.chainId

/** Undefined while nothing has resolved: an unknown balance must read empty, not a confident `0`. */
const totalFiat = (options: SafeAccountOption[]): string | undefined => {
  const resolved = options.filter((option) => option.fiatTotal !== undefined)
  if (resolved.length === 0) return undefined

  return String(resolved.reduce((sum, option) => sum + Number(option.fiatTotal), 0))
}

/** Undefined when the chains disagree: a header may not claim a `3/5` only some of them have. */
const sharedSetup = (options: SafeAccountOption[]): Pick<SafeAccountGroup, 'threshold' | 'owners'> => {
  const [first, ...rest] = options
  const isShared =
    first.threshold !== undefined &&
    first.owners !== undefined &&
    rest.every((option) => option.threshold === first.threshold && option.owners === first.owners)

  return isShared ? { threshold: first.threshold, owners: first.owners } : {}
}

/**
 * Groups per-chain options by address. A Safe on one chain stays a flat row — a header with a single
 * child is noise. Top-level order follows first appearance; chain rows sort by chain name.
 */
export const groupSafeAccounts = (options: SafeAccountOption[]): SafeAccountEntry[] => {
  const byAddress = new Map<string, SafeAccountOption[]>()

  for (const option of options) {
    const siblings = byAddress.get(option.address)
    if (siblings) siblings.push(option)
    else byAddress.set(option.address, [option])
  }

  return Array.from(byAddress.values()).map((siblings) =>
    siblings.length === 1
      ? siblings[0]
      : {
          address: siblings[0].address,
          name: siblings.find((option) => option.name !== undefined)?.name,
          accounts: [...siblings].sort((a, b) => chainLabel(a).localeCompare(chainLabel(b))),
          fiatTotal: totalFiat(siblings),
          ...sharedSetup(siblings),
        },
  )
}
