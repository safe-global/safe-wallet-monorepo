import { getAddress, Interface } from 'ethers'
import { faker } from '@faker-js/faker'
import { OperationType } from '@safe-global/types-kit'
import { GUARD_NOT_SUPPORTED_ERROR } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { PolicyConfiguration, PolicyGuardState } from '../../types'
import { createAllowlistSetupTxs } from '../createAllowlistSetupTxs'
import { getConfigurationRoot } from '../policyGuardEncoders'

const TUPLE = 'tuple(address target, bytes4 selector, uint8 operation, address policy, bytes data)'
const iface = new Interface([
  `function configureImmediately(${TUPLE}[] configurations)`,
  'function requestConfiguration(bytes32 configureRoot)',
  'function setGuard(address)',
  'function setModuleGuard(address)',
])

const safeAddress = getAddress(faker.finance.ethereumAddress())
const guardAddress = getAddress(faker.finance.ethereumAddress())
const configurations: PolicyConfiguration[] = [
  {
    target: getAddress(faker.finance.ethereumAddress()),
    selector: '0xa9059cbb',
    operation: OperationType.Call,
    policy: getAddress(faker.finance.ethereumAddress()),
    data: '0x1234',
  },
]

const build = (guardState: PolicyGuardState) =>
  createAllowlistSetupTxs({ safeAddress, guardAddress, guardState, configurations })

const describeCalls = (guardState: PolicyGuardState) =>
  build(guardState).map((tx) => ({ to: tx.to, name: iface.parseTransaction({ data: tx.data })?.name }))

describe('createAllowlistSetupTxs', () => {
  it('configures immediately, then sets both guard slots, when no guard is installed', () => {
    expect(describeCalls({ status: 'none' })).toEqual([
      { to: guardAddress, name: 'configureImmediately' },
      { to: safeAddress, name: 'setGuard' },
      { to: safeAddress, name: 'setModuleGuard' },
    ])
  })

  it('only requests the configuration root when both slots are set', () => {
    const txs = build({ status: 'known' })

    expect(describeCalls({ status: 'known' })).toEqual([{ to: guardAddress, name: 'requestConfiguration' }])
    expect(iface.parseTransaction({ data: txs[0].data })?.args[0]).toBe(getConfigurationRoot(configurations))
  })

  it('requests the configuration before setting the missing transaction guard', () => {
    expect(describeCalls({ status: 'partial', missingSlot: 'transaction' })).toEqual([
      { to: guardAddress, name: 'requestConfiguration' },
      { to: safeAddress, name: 'setGuard' },
    ])

    const txs = build({ status: 'partial', missingSlot: 'transaction' })
    expect(iface.parseTransaction({ data: txs[0].data })?.args[0]).toBe(getConfigurationRoot(configurations))
    expect(iface.parseTransaction({ data: txs[1].data })?.args[0]).toBe(guardAddress)
  })

  it('requests the configuration before setting the missing module guard', () => {
    expect(describeCalls({ status: 'partial', missingSlot: 'module' })).toEqual([
      { to: guardAddress, name: 'requestConfiguration' },
      { to: safeAddress, name: 'setModuleGuard' },
    ])

    const txs = build({ status: 'partial', missingSlot: 'module' })
    expect(iface.parseTransaction({ data: txs[0].data })?.args[0]).toBe(getConfigurationRoot(configurations))
    expect(iface.parseTransaction({ data: txs[1].data })?.args[0]).toBe(guardAddress)
  })

  it('throws for a foreign guard', () => {
    expect(() => build({ status: 'unknown', foreignGuards: [] })).toThrow(GUARD_NOT_SUPPORTED_ERROR)
  })

  it('throws for an unsupported Safe', () => {
    expect(() => build({ status: 'unsupported' })).toThrow(GUARD_NOT_SUPPORTED_ERROR)
  })
})
