import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import type {
  PendingTransactionDto,
  PolicyConfigurationDto,
  SpacePoliciesGetPendingPoliciesV1ApiResponse,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type {
  GuardPolicyType,
  GuardSetup,
  GuardSetupTransaction,
  PendingGuardChange,
  PolicySafe,
} from '@safe-global/views/features/spaces/components/Policies/types'
import { NO_SELECTOR } from '../shared/accessSelector'
import { getPolicyDeployments } from '../shared/policyDeployments'
import { getPolicyGuardAddress } from '@/features/policy-guard/services'
import { ERC20_TRANSFER_FROM_SELECTOR, ERC20_TRANSFER_SELECTOR } from '../shared/erc20TransferPolicy'
import { safeManagementFunctionBySelector } from '../SafeManagementPolicy/contracts'
import { getGuardSetupProgress } from './guardSetup'

type PendingDto = SpacePoliciesGetPendingPoliciesV1ApiResponse[number]

const POLICY_TYPE_BY_CONTRACT_TYPE: Partial<Record<PolicyType, GuardPolicyType>> = {
  [PolicyType.TokenWithdraw]: 'allowlist',
  [PolicyType.MultiSend]: 'multisend',
}

const isSelector = (selector: string, expected: string): boolean => selector.toLowerCase() === expected.toLowerCase()

/**
 * The guard policy a configuration belongs to. Read from its access first, so a removal, which names
 * no policy contract, is still recognised; then from the policy contract.
 */
const classify = (configuration: PolicyConfigurationDto, safe: PolicySafe): GuardPolicyType | undefined => {
  const { target, selector, policy } = configuration

  if (sameAddress(target, safe.address) && safeManagementFunctionBySelector(selector)) return 'safe-management'
  if (isSelector(selector, ERC20_TRANSFER_SELECTOR) || isSelector(selector, ERC20_TRANSFER_FROM_SELECTOR)) {
    return 'allowlist'
  }
  // A native transfer to the zero target is the fallback, not an allowlist recipient.
  if (isSelector(selector, NO_SELECTOR) && !sameAddress(target, ZERO_ADDRESS)) return 'allowlist'

  const contracts = getPolicyDeployments(safe.chainId)?.policies ?? {}
  const contractType = (Object.keys(contracts) as PolicyType[]).find((type) => sameAddress(contracts[type], policy))
  return contractType ? POLICY_TYPE_BY_CONTRACT_TYPE[contractType] : undefined
}

/** One type when every configuration is the same recognised policy; otherwise the row is a generic change. */
const policyTypeOf = (
  configurations: PolicyConfigurationDto[] | null,
  safe: PolicySafe,
): GuardPolicyType | undefined => {
  if (!configurations?.length) return undefined

  const types = new Set(configurations.map((configuration) => classify(configuration, safe)))
  const [type] = types
  return types.size === 1 ? type : undefined
}

const toTransaction = (tx: PendingTransactionDto): GuardSetupTransaction => ({
  safeTxHash: tx.safeTxHash,
  nonce: tx.nonce,
  confirmationsSubmitted: tx.confirmations,
  confirmationsRequired: tx.confirmationsRequired,
  proposedAt: tx.proposedAt,
})

const toRow = (
  id: string,
  safe: PolicySafe,
  setup: GuardSetup,
  configurations: PolicyConfigurationDto[] | null,
): PendingGuardChange => ({
  id,
  type: 'policy-change',
  status: 'pending',
  safe,
  enforcement: { via: 'guard', guardAddress: setup.guard ?? getPolicyGuardAddress(safe.chainId) ?? '' },
  // Nothing is enforced until the change is applied.
  enabled: false,
  setup,
  progress: getGuardSetupProgress(setup),
  data: { policyType: policyTypeOf(configurations, safe), ruleCount: configurations?.length ?? null },
})

const toGuardChange = (dto: PendingDto): PendingGuardChange[] => {
  switch (dto.kind) {
    case 'immediate-guard-policies':
      return [
        toRow(
          `guard-change:${dto.safe.chainId}:${dto.safe.address}:${dto.transaction.safeTxHash}:${dto.guard}`,
          dto.safe,
          { flow: 'immediate', guard: dto.guard, transaction: toTransaction(dto.transaction) },
          dto.configurations,
        ),
      ]

    case 'delayed-guard-policies':
      return [
        toRow(
          `guard-change:${dto.safe.chainId}:${dto.safe.address}:${dto.guard ?? 'draft'}:${dto.root}`,
          dto.safe,
          {
            flow: 'delayed',
            status: dto.status,
            guard: dto.guard,
            root: dto.root,
            configurations: dto.configurations,
            readyAt: dto.readyAt,
            expiresAt: dto.expiresAt,
            transaction: dto.transaction ? toTransaction(dto.transaction) : null,
          },
          dto.configurations,
        ),
      ]

    // Spending limits have their own rows, and a guard installation is shown with the change it carries.
    default:
      return []
  }
}

/** One row per guard change that has not taken effect yet. */
export const mapPendingGuardChanges = (dtos: PendingDto[]): PendingGuardChange[] => {
  const rows = dtos.flatMap(toGuardChange)
  // CGW reports one immediate item per call, so a batch configuring the guard twice must not list twice.
  return rows.filter((row, index) => rows.findIndex((other) => other.id === row.id) === index)
}

/** The next moment a delayed change moves on by the clock alone: its delay ending or its window closing. */
export const getNextGuardBoundary = (dtos: PendingDto[], now: number): number | undefined => {
  const upcoming = dtos.flatMap((dto) =>
    dto.kind === 'delayed-guard-policies'
      ? [dto.readyAt, dto.expiresAt].filter((at): at is number => at !== null && at > now)
      : [],
  )
  return upcoming.length > 0 ? Math.min(...upcoming) : undefined
}
