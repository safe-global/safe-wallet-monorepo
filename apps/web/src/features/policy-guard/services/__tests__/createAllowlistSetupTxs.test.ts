import { getAddress, Interface } from 'ethers'
import { faker } from '@faker-js/faker'
import { OperationType } from '@safe-global/types-kit'
import {
  GUARD_NOT_SUPPORTED_ERROR,
  TOO_MANY_CONFIGURATIONS_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { PolicyConfiguration, PolicyGuardState } from '../../types'
import { MAX_POLICY_CONFIGURATIONS } from '../allowlistConfigurations'
import { createAllowlistSetupTxs } from '../createAllowlistSetupTxs'
import { withFirstSetupDefaults } from '../firstSetupDefaults'
import { getConfigurationRoot } from '../policyGuardEncoders'

const TUPLE = 'tuple(address target, bytes4 selector, uint8 operation, address policy, bytes data)'
const iface = new Interface([
  `function configureImmediately(${TUPLE}[] configurations)`,
  'function requestConfiguration(bytes32 configureRoot)',
  'function setGuard(address)',
  'function setModuleGuard(address)',
])

const chainId = '11155111'
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

const setup = (guardState: PolicyGuardState, input = configurations) =>
  createAllowlistSetupTxs({ chainId, safeAddress, guardAddress, guardState, configurations: input })

const build = (guardState: PolicyGuardState) => setup(guardState).txs

const describeCalls = (guardState: PolicyGuardState) =>
  build(guardState).map((tx) => ({ to: tx.to, name: iface.parseTransaction({ data: tx.data })?.name }))

const toTuple = ({ target, selector, operation, policy, data }: PolicyConfiguration) => [
  target,
  selector,
  BigInt(operation),
  policy,
  data,
]

describe('createAllowlistSetupTxs', () => {
  it('configures immediately, then sets both guard slots, when no guard is installed', () => {
    expect(describeCalls({ status: 'none' })).toEqual([
      { to: guardAddress, name: 'configureImmediately' },
      { to: safeAddress, name: 'setGuard' },
      { to: safeAddress, name: 'setModuleGuard' },
    ])
  })

  it('installs the MultiSend bindings and both fallbacks on a first setup, and returns them with their root', () => {
    const { txs, configurations: installed, root } = setup({ status: 'none' })
    const expected = withFirstSetupDefaults(chainId, configurations)

    const configured = iface.parseTransaction({ data: txs[0].data })?.args[0]
    expect(configured.map((tuple: unknown[]) => [...tuple])).toEqual(expected.map(toTuple))
    expect(installed).toEqual(expected)
    expect(root).toBe(getConfigurationRoot(expected))
    expect(expected.length).toBeGreaterThan(configurations.length)
  })

  it('counts the first-setup defaults towards the maximum', () => {
    const defaults = withFirstSetupDefaults(chainId, []).length
    const many = Array.from({ length: MAX_POLICY_CONFIGURATIONS - defaults + 1 }, (_, i) => ({
      ...configurations[0],
      target: getAddress(`0x${(i + 1).toString(16).padStart(40, '0')}`),
    }))

    expect(() => setup({ status: 'known' }, many)).not.toThrow()
    expect(() => setup({ status: 'none' }, many)).toThrow(TOO_MANY_CONFIGURATIONS_ERROR)
    expect(() => setup({ status: 'none' }, many.slice(1))).not.toThrow()
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

  it.each<PolicyGuardState>([{ status: 'known' }, { status: 'partial', missingSlot: 'module' }])(
    'returns only the given configurations and their root for $status, adding no defaults',
    (guardState) => {
      const { configurations: requested, root } = setup(guardState)

      expect(requested).toEqual(configurations)
      expect(root).toBe(getConfigurationRoot(configurations))
    },
  )

  it('throws for a foreign guard', () => {
    expect(() => build({ status: 'unknown', foreignGuards: [] })).toThrow(GUARD_NOT_SUPPORTED_ERROR)
  })

  it('throws for an unsupported Safe', () => {
    expect(() => build({ status: 'unsupported' })).toThrow(GUARD_NOT_SUPPORTED_ERROR)
  })
})
