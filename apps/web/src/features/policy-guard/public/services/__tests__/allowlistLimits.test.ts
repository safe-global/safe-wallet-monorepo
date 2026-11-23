import { getAddress } from 'ethers'
import { faker } from '@faker-js/faker'
import { OperationType } from '@safe-global/types-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import {
  TOO_MANY_CONFIGURATIONS_ERROR,
  TOO_MANY_RECIPIENTS_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { PolicyConfiguration } from '../../types'
import { encodeErc20TransferPolicyData } from '../allowlistConfigurations'
import { estimateConfigurationGas, getConfigurationLimitError, isAllowlistRemovable } from '../allowlistLimits'

const addresses = (count: number): string[] =>
  Array.from({ length: count }, () => getAddress(faker.finance.ethereumAddress()))

const tokenRule = (recipients: string[]): PolicyConfiguration => ({
  target: getAddress(faker.finance.ethereumAddress()),
  selector: '0xa9059cbb',
  operation: OperationType.Call,
  policy: getAddress(faker.finance.ethereumAddress()),
  data: encodeErc20TransferPolicyData(recipients),
})

const ruleWithoutData = (): PolicyConfiguration => ({
  target: getAddress(faker.finance.ethereumAddress()),
  selector: '0x8d80ff0a',
  operation: OperationType.DelegateCall,
  policy: getAddress(faker.finance.ethereumAddress()),
  data: '0x',
})

describe('estimateConfigurationGas', () => {
  it('should add 406,000, then 119,000 per rule and 112,000 per recipient, when a token rule and a batch rule are set', () => {
    const configurations = [tokenRule(addresses(2)), ruleWithoutData()]

    expect(estimateConfigurationGas(configurations)).toBe(406_000 + 2 * 119_000 + 2 * 112_000)
  })

  it('should add 60,000 per revoked approval, when the transaction revokes approvals first', () => {
    const configurations = [ruleWithoutData()]

    expect(estimateConfigurationGas(configurations, 3)).toBe(406_000 + 119_000 + 3 * 60_000)
  })
})

describe('getConfigurationLimitError', () => {
  it('should find nothing, when 100 rules each fit', () => {
    const configurations = [tokenRule(addresses(1023)), ...Array.from({ length: 99 }, ruleWithoutData)]

    expect(getConfigurationLimitError(configurations)).toBeUndefined()
  })

  it('should say the allowlist is too large, when there are more than 100 rules', () => {
    const configurations = Array.from({ length: 101 }, ruleWithoutData)

    expect(getConfigurationLimitError(configurations)).toBe(TOO_MANY_CONFIGURATIONS_ERROR)
  })

  it('should say a token has too many recipients, when its rule holds more than 65,536 bytes', () => {
    const configurations = [tokenRule(addresses(1024))]

    expect(getConfigurationLimitError(configurations)).toBe(TOO_MANY_RECIPIENTS_ERROR)
  })
})

describe('isAllowlistRemovable', () => {
  it('should be true, when its removal needs exactly 100 rules', () => {
    const rules = [
      ...addresses(48).map((tokenAddress) => ({ tokenAddress, recipients: addresses(1) })),
      { tokenAddress: ZERO_ADDRESS, recipients: addresses(1) },
    ]

    expect(isAllowlistRemovable(rules)).toBe(true)
  })

  it('should be false, when its removal needs 101 rules', () => {
    const rules = [
      ...addresses(48).map((tokenAddress) => ({ tokenAddress, recipients: addresses(1) })),
      { tokenAddress: ZERO_ADDRESS, recipients: addresses(2) },
    ]

    expect(isAllowlistRemovable(rules)).toBe(false)
  })

  it('should be false, when a token has more recipients than one removal rule can revoke', () => {
    const rules = [{ tokenAddress: getAddress(faker.finance.ethereumAddress()), recipients: addresses(1024) }]

    expect(isAllowlistRemovable(rules)).toBe(false)
  })
})
