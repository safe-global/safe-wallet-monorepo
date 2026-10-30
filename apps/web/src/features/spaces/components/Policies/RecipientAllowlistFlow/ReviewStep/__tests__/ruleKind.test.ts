import { OperationType } from '@safe-global/types-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { PolicyConfiguration } from '@/features/policy-guard'
import { getPolicyEngineAddress } from '@/features/policy-guard/services'
import { getInstalledFallback, getRuleKind } from '../ruleKind'

const CHAIN_ID = '11155111'
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
    ['AllowPolicy', 'allow'],
    ['DenyPolicy', 'deny'],
    ['MultiSendPolicy', 'multiSend'],
    ['ERC20TransferPolicy', 'erc20'],
  ] as const)('labels a %s entry as %s', (contract, kind) => {
    expect(getRuleKind(CHAIN_ID, entry({ policy: policy(contract).toLowerCase() }))).toBe(kind)
  })

  it.each([
    ['the zero policy of a revocation', ZERO_ADDRESS],
    ['a policy the review does not know', '0x2222222222222222222222222222222222222222'],
  ])('labels %s as unknown rather than an ERC-20 allowlist', (_, unknownPolicy) => {
    expect(getRuleKind(CHAIN_ID, entry({ policy: unknownPolicy }))).toBe('unknown')
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
