import { AbiCoder, getAddress } from 'ethers'
import { faker } from '@faker-js/faker'
import { OperationType } from '@safe-global/types-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { PolicyConfiguration } from '@/features/policy-guard/public/types'
import { getPolicyEngineAddress } from '@/features/policy-guard/public/services/policyEngineDeployments'
import { getInstalledFallback, getRuleKind } from '../ruleKind'

const CHAIN_ID = '11155111'
const SAFE = getAddress(faker.finance.ethereumAddress())
const policy = (contract: Parameters<typeof getPolicyEngineAddress>[1]) => getPolicyEngineAddress(CHAIN_ID, contract)!

const entry = (overrides: Partial<PolicyConfiguration>): PolicyConfiguration => ({
  target: '0x1111111111111111111111111111111111111111',
  selector: '0xa9059cbb',
  operation: OperationType.Call,
  policy: policy('ERC20TransferPolicy'),
  data: '0x',
  ...overrides,
})

const fallback = (contract: 'AllowPolicy' | 'DenyPolicy', operation = OperationType.Call) =>
  entry({ target: ZERO_ADDRESS, selector: '0x00000000', operation, policy: policy(contract) })

describe('getRuleKind', () => {
  it.each([
    ['NativeTransferPolicy', 'native'],
    ['AllowPolicy', 'allowCall'],
    ['DenyPolicy', 'deny'],
    ['MultiSendPolicy', 'multiSend'],
    ['ERC20TransferPolicy', 'erc20'],
  ] as const)('labels a %s entry as %s', (contract, kind) => {
    expect(getRuleKind(CHAIN_ID, entry({ policy: policy(contract).toLowerCase() }), SAFE)).toBe(kind)
  })

  it('should label the catch-all allow, when the allow policy is the fallback', () => {
    expect(getRuleKind(CHAIN_ID, fallback('AllowPolicy'), SAFE)).toBe('allow')
  })

  it('labels a policy the review does not know as unknown rather than an ERC-20 allowlist', () => {
    expect(getRuleKind(CHAIN_ID, entry({ policy: '0x2222222222222222222222222222222222222222' }), SAFE)).toBe('unknown')
  })

  it('should, when the allow policy is bound to the Safe calling itself with no data, label a reject rule', () => {
    expect(
      getRuleKind(CHAIN_ID, entry({ target: SAFE, selector: '0x00000000', policy: policy('AllowPolicy') }), SAFE),
    ).toBe('reject')
  })

  it('should, when the allow policy lets another address be called with no data, label an allowed call', () => {
    const target = getAddress(faker.finance.ethereumAddress())

    expect(getRuleKind(CHAIN_ID, entry({ target, selector: '0x00000000', policy: policy('AllowPolicy') }), SAFE)).toBe(
      'allowCall',
    )
  })

  it('should label a removal, when the configuration binds the zero policy', () => {
    expect(getRuleKind(CHAIN_ID, entry({ policy: ZERO_ADDRESS }), SAFE)).toBe('removal')
  })

  it('should label an allowed call, when the allow policy is bound to one access rather than the catch-all', () => {
    expect(getRuleKind(CHAIN_ID, entry({ selector: '0xe19a9dd9', policy: policy('AllowPolicy') }), SAFE)).toBe(
      'allowCall',
    )
  })

  it('should label a revocation, when the ERC-20 rule sets every recipient to no permission', () => {
    const data = AbiCoder.defaultAbiCoder().encode(
      ['tuple(address recipient, uint8 permission)[]'],
      [[['0x3333333333333333333333333333333333333333', 0]]],
    )

    expect(getRuleKind(CHAIN_ID, entry({ data }), SAFE)).toBe('erc20Revoke')
  })

  it('should label an ERC-20 allowlist, when one recipient keeps a permission', () => {
    const data = AbiCoder.defaultAbiCoder().encode(
      ['tuple(address recipient, uint8 permission)[]'],
      [
        [
          ['0x3333333333333333333333333333333333333333', 0],
          ['0x4444444444444444444444444444444444444444', 2],
        ],
      ],
    )

    expect(getRuleKind(CHAIN_ID, entry({ data }), SAFE)).toBe('erc20')
  })
})

describe('getInstalledFallback', () => {
  it.each([
    ['AllowPolicy', 'allow'],
    ['DenyPolicy', 'deny'],
  ] as const)('reads the CALL fallback installed with %s', (contract, expected) => {
    expect(getInstalledFallback(CHAIN_ID, [entry({}), fallback(contract)])).toBe(expected)
  })

  it('is undefined when nothing is installed at the fallback', () => {
    expect(getInstalledFallback(CHAIN_ID, [entry({})])).toBeUndefined()
  })

  it('ignores a DELEGATECALL-only fallback', () => {
    expect(getInstalledFallback(CHAIN_ID, [fallback('DenyPolicy', OperationType.DelegateCall)])).toBeUndefined()
  })

  it('is undefined when the fallback holds neither AllowPolicy nor DenyPolicy', () => {
    expect(
      getInstalledFallback(CHAIN_ID, [{ ...fallback('AllowPolicy'), policy: policy('NativeTransferPolicy') }]),
    ).toBeUndefined()
  })
})
