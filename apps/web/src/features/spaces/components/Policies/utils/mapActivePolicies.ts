import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type {
  ActivePolicyDto,
  ProposerPolicyDataDto,
  SpendingLimitAllowanceDto,
  SpendingLimitPolicyDataDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { Policy, PolicyAllowance, PolicyTokenInfo, ProposerPolicy, SpendingLimitPolicy } from '../types'

export type ResolveTokenInfo = (chainId: string, tokenAddress: string) => PolicyTokenInfo | undefined

/** A token the gateway does not know still has to render its amount, so it shows base units. */
const unknownToken = (address: string): PolicyTokenInfo => ({
  address,
  symbol: shortenAddress(address),
  decimals: 0,
  logoUri: null,
})

const toAllowance = (
  allowance: SpendingLimitAllowanceDto,
  chainId: string,
  resolveToken: ResolveTokenInfo,
): PolicyAllowance => {
  const remaining = BigInt(allowance.amount) - BigInt(allowance.spent)

  return {
    token: resolveToken(chainId, allowance.tokenAddress) ?? unknownToken(allowance.tokenAddress),
    amount: allowance.amount,
    spent: allowance.spent,
    remaining: (remaining > 0n ? remaining : 0n).toString(),
    resetPeriodMinutes: allowance.resetPeriodMinutes,
    resetsAtMinute: allowance.resetsAtMinute,
  }
}

const isSpendingLimitData = (data: ActivePolicyDto['data']): data is SpendingLimitPolicyDataDto => 'spenders' in data

const isProposerData = (data: ActivePolicyDto['data']): data is ProposerPolicyDataDto => 'proposers' in data

const toSpendingLimit = (dto: ActivePolicyDto, resolveToken: ResolveTokenInfo): SpendingLimitPolicy | null => {
  if (dto.enforcement.via !== 'module' || !isSpendingLimitData(dto.data)) return null

  const { chainId } = dto.safe

  return {
    id: `spending-limit:${chainId}:${dto.safe.address}:${dto.data.module}`,
    type: 'spending-limit',
    safe: dto.safe,
    enforcement: dto.enforcement,
    enabled: dto.enabled,
    data: {
      spenders: dto.data.spenders.map((spender) => ({
        spender: spender.spender,
        allowances: spender.allowances.map((allowance) => toAllowance(allowance, chainId, resolveToken)),
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

const toPolicies = (dto: ActivePolicyDto, resolveToken: ResolveTokenInfo): Policy[] => {
  switch (dto.type) {
    case 'spending-limit': {
      const policy = toSpendingLimit(dto, resolveToken)
      return policy ? [{ ...policy, status: 'active' }] : []
    }
    case 'proposer':
      return toProposers(dto).map((policy) => ({ ...policy, status: 'active' }))
    default:
      return []
  }
}

/** Every distinct ERC-20 the policies reference. The native currency needs no lookup. */
export const getReferencedTokens = (dtos: ActivePolicyDto[]): { chainId: string; address: string }[] => {
  const seen = new Set<string>()
  const tokens: { chainId: string; address: string }[] = []

  for (const dto of dtos) {
    if (!isSpendingLimitData(dto.data)) continue

    for (const spender of dto.data.spenders) {
      for (const { tokenAddress } of spender.allowances) {
        const key = `${dto.safe.chainId}:${tokenAddress.toLowerCase()}`
        if (tokenAddress.toLowerCase() === ZERO_ADDRESS || seen.has(key)) continue

        seen.add(key)
        tokens.push({ chainId: dto.safe.chainId, address: tokenAddress })
      }
    }
  }

  return tokens
}

/** A policy of a type the page does not render, or with data of another type's shape, is left out. */
export const mapActivePolicies = (dtos: ActivePolicyDto[], resolveToken: ResolveTokenInfo): Policy[] =>
  dtos.flatMap((dto) => toPolicies(dto, resolveToken))
