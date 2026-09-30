import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type {
  ActivePolicyDto,
  PendingPolicyDto,
  ProposerPolicyDataDto,
  SpendingLimitAllowanceDto,
  SpendingLimitPolicyDataDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { Policy, PolicyAllowance, PolicyTokenInfo, ProposerPolicy, SpendingLimitPolicy } from '../types'

export type ResolveTokenInfo = (chainId: string, tokenAddress: string) => PolicyTokenInfo | undefined

/** A token the gateway does not know still has to render its amount, so it shows base units. */
export const unknownToken = (address: string): PolicyTokenInfo => ({
  address,
  symbol: shortenAddress(address),
  decimals: 0,
  logoUri: null,
})

const toToken = ({ tokenAddress, tokenMetadata }: SpendingLimitAllowanceDto): PolicyTokenInfo =>
  tokenMetadata
    ? {
        address: tokenAddress,
        symbol: tokenMetadata.symbol,
        decimals: tokenMetadata.decimals,
        logoUri: tokenMetadata.logoUri,
      }
    : unknownToken(tokenAddress)

const toAllowance = (allowance: SpendingLimitAllowanceDto): PolicyAllowance => {
  const remaining = BigInt(allowance.amount) - BigInt(allowance.spent)

  return {
    token: toToken(allowance),
    amount: allowance.amount,
    spent: allowance.spent,
    remaining: (remaining > 0n ? remaining : 0n).toString(),
    resetPeriodMinutes: allowance.resetPeriodMinutes,
    resetsAtMinute: allowance.resetsAtMinute,
    createdAt: allowance.createdAt,
  }
}

const isSpendingLimitData = (data: ActivePolicyDto['data']): data is SpendingLimitPolicyDataDto => 'spenders' in data

const isProposerData = (data: ActivePolicyDto['data']): data is ProposerPolicyDataDto => 'proposers' in data

/** Deleting the last allowance leaves the module enabled, so a revoked policy keeps coming back empty. */
const hasNoAllowances = (data: SpendingLimitPolicyDataDto): boolean =>
  data.spenders.every((spender) => spender.allowances.length === 0)

const toSpendingLimit = (dto: ActivePolicyDto): SpendingLimitPolicy | null => {
  if (dto.enforcement.via !== 'module' || !isSpendingLimitData(dto.data)) return null
  if (hasNoAllowances(dto.data)) return null

  return {
    id: `spending-limit:${dto.safe.chainId}:${dto.safe.address}:${dto.data.module}`,
    type: 'spending-limit',
    safe: dto.safe,
    enforcement: dto.enforcement,
    enabled: dto.enabled,
    data: {
      spenders: dto.data.spenders.map((spender) => ({
        spender: spender.spender,
        allowances: spender.allowances.map(toAllowance),
      })),
    },
  }
}

/** The drawer describes one proposer, so each proposer on a Safe gets its own row. */
const toProposers = (dto: ActivePolicyDto): ProposerPolicy[] => {
  if (dto.enforcement.via !== 'offchain' || !isProposerData(dto.data)) return []

  const { enforcement } = dto

  return dto.data.proposers.map((proposer) => ({
    id: `proposer:${dto.safe.chainId}:${dto.safe.address}:${proposer.proposer}`,
    type: 'proposer',
    safe: dto.safe,
    enforcement,
    enabled: dto.enabled,
    data: { proposers: [proposer] },
  }))
}

const toPolicies = (dto: ActivePolicyDto): Policy[] => {
  switch (dto.type) {
    case 'spending-limit': {
      const policy = toSpendingLimit(dto)
      return policy ? [{ ...policy, status: 'active' }] : []
    }
    case 'proposer':
      return toProposers(dto).map((policy) => ({ ...policy, status: 'active' }))
    default:
      return []
  }
}

/** Every distinct ERC-20 the queued policies reference. The native currency needs no lookup. */
export const getReferencedTokens = (pendingDtos: PendingPolicyDto[]): { chainId: string; address: string }[] => {
  const refs = pendingDtos.flatMap((dto) =>
    dto.data.changes.flatMap((change) =>
      change.kind === 'set-allowance' ? [{ chainId: dto.safe.chainId, address: change.token }] : [],
    ),
  )

  const seen = new Set<string>()
  return refs.filter(({ chainId, address }) => {
    const lowerCaseAddress = address.toLowerCase()
    const key = `${chainId}:${lowerCaseAddress}`
    if (lowerCaseAddress === ZERO_ADDRESS || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Turns the gateway's active policies into the shapes the Policies table renders.
 *
 * @param dtos - Active policies as the gateway returns them; an allowance without token metadata falls back to base units.
 * @returns One entry per policy the page can render. Left out: a policy of a type the page does not
 *   render, one whose data has another type's shape, and a spending limit whose allowances are all
 *   gone — deleting the last allowance leaves the module enabled, so the gateway keeps returning it.
 */
export const mapActivePolicies = (dtos: ActivePolicyDto[]): Policy[] => dtos.flatMap(toPolicies)
