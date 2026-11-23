import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import {
  TOO_MANY_CONFIGURATIONS_ERROR,
  TOO_MANY_RECIPIENTS_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { AllowlistRule } from '@/features/spaces/public/types'
import type { PolicyConfiguration } from '../types'
import {
  decodeErc20TransferPolicyData,
  encodeErc20TransferPolicyData,
  MAX_POLICY_CONFIGURATIONS,
} from './allowlistConfigurations'

/** What the gateway stores for one rule. */
export const MAX_CONFIGURATION_DATA_BYTES = 65_536
/** What one transaction can use on Ethereum. */
export const MAX_TRANSACTION_GAS = 16_777_216

// Measured on Sepolia for a first setup; an apply that adds rules costs about the same per rule and recipient
const BASE_GAS = 406_000
const GAS_PER_RULE = 119_000
const GAS_PER_RECIPIENT = 112_000
const GAS_PER_REVOKED_APPROVAL = 60_000

// setGuard, setModuleGuard and setFallbackHandler, which the removal allows
const REMOVAL_SETTER_RULES = 3

const dataBytes = (data: string): number => (data.length - 2) / 2

// Only ERC-20 transfer rules carry recipients; other data counts as none
const countRecipients = ({ data }: PolicyConfiguration): number => {
  if (data === '0x') return 0
  try {
    return decodeErc20TransferPolicyData(data).length
  } catch {
    return 0
  }
}

/** The gas of one transaction that revokes `revokedApprovals` approvals and sets `configurations`, rounded up. */
export const estimateConfigurationGas = (configurations: PolicyConfiguration[], revokedApprovals = 0): number =>
  BASE_GAS +
  configurations.length * GAS_PER_RULE +
  configurations.reduce((sum, configuration) => sum + countRecipients(configuration), 0) * GAS_PER_RECIPIENT +
  revokedApprovals * GAS_PER_REVOKED_APPROVAL

/** Why the gateway would not store `configurations` as one request, if it would not. */
export const getConfigurationLimitError = (configurations: PolicyConfiguration[]): string | undefined => {
  if (configurations.length > MAX_POLICY_CONFIGURATIONS) return TOO_MANY_CONFIGURATIONS_ERROR
  if (configurations.some(({ data }) => dataBytes(data) > MAX_CONFIGURATION_DATA_BYTES)) {
    return TOO_MANY_RECIPIENTS_ERROR
  }
  return undefined
}

/**
 * Whether the first root of the allowlist's removal stays within the limits: two rules per token, one per ETH
 * recipient and the three Safe setters, each token with all its recipients.
 */
export const isAllowlistRemovable = (rules: AllowlistRule[]): boolean => {
  const tokenRules = rules.filter(({ tokenAddress }) => !sameAddress(tokenAddress, ZERO_ADDRESS))
  const ethRecipients = rules.filter(({ tokenAddress }) => sameAddress(tokenAddress, ZERO_ADDRESS))
  const removalRules =
    tokenRules.length * 2 + ethRecipients.flatMap(({ recipients }) => recipients).length + REMOVAL_SETTER_RULES

  return (
    removalRules <= MAX_POLICY_CONFIGURATIONS &&
    tokenRules.every(
      ({ recipients }) => dataBytes(encodeErc20TransferPolicyData(recipients)) <= MAX_CONFIGURATION_DATA_BYTES,
    )
  )
}
