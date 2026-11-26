import { getAddress, Interface } from 'ethers'
import { faker } from '@faker-js/faker'
import { OperationType } from '@safe-global/types-kit'
import {
  GUARD_NOT_SUPPORTED_ERROR,
  TOO_MANY_CONFIGURATIONS_ERROR,
  TRANSACTION_TOO_LARGE_ERROR,
} from '../allowlistErrors'
import type { PolicyConfiguration, PolicyGuardState } from '../../types'
import { encodeErc20TransferPolicyData, MAX_POLICY_CONFIGURATIONS } from '../allowlistConfigurations'
import { createAllowlistSetupTxs } from '../createAllowlistSetupTxs'
import { withFirstSetupDefaults } from '../../../services/firstSetupDefaults'
import { getConfigurationRoot } from '../policyGuardEncoders'

const TUPLE = 'tuple(address target, bytes4 selector, uint8 operation, address policy, bytes data)'
const iface = new Interface([
  `function configureImmediately(${TUPLE}[] configurations)`,
  'function requestConfiguration(bytes32 configureRoot)',
  'function setGuard(address)',
  'function setModuleGuard(address)',
  'function setFallbackHandler(address)',
])

const chainId = '11155111'
const TOKEN_CALLBACK_HANDLER = '0x54e86d004d71a8D2112ec75FaCE57D730b0433F3'
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
  it('configures immediately, then sets both guard slots and the fallback handler, when no guard is installed', () => {
    expect(describeCalls({ status: 'none' })).toEqual([
      { to: guardAddress, name: 'configureImmediately' },
      { to: safeAddress, name: 'setGuard' },
      { to: safeAddress, name: 'setModuleGuard' },
      { to: safeAddress, name: 'setFallbackHandler' },
    ])
  })

  it('should set the TokenCallbackHandler, when the Safe uses another fallback handler', () => {
    const { txs } = createAllowlistSetupTxs({
      chainId,
      safeAddress,
      guardAddress,
      guardState: { status: 'none' },
      configurations,
      currentFallbackHandler: getAddress(faker.finance.ethereumAddress()),
    })

    expect(iface.parseTransaction({ data: txs[3].data })?.args[0]).toBe(TOKEN_CALLBACK_HANDLER)
  })

  it('should leave the fallback handler out, when the Safe already uses the TokenCallbackHandler', () => {
    const { txs } = createAllowlistSetupTxs({
      chainId,
      safeAddress,
      guardAddress,
      guardState: { status: 'none' },
      configurations,
      currentFallbackHandler: TOKEN_CALLBACK_HANDLER.toLowerCase(),
    })

    expect(txs.map((tx) => iface.parseTransaction({ data: tx.data })?.name)).toEqual([
      'configureImmediately',
      'setGuard',
      'setModuleGuard',
    ])
  })

  it('installs the MultiSend bindings and both fallbacks on a first setup, and returns them with their root', () => {
    const { txs, configurations: installed, root } = setup({ status: 'none' })
    const expected = withFirstSetupDefaults(chainId, safeAddress, configurations)

    const configured = iface.parseTransaction({ data: txs[0].data })?.args[0]
    expect(configured.map((tuple: unknown[]) => [...tuple])).toEqual(expected.map(toTuple))
    expect(installed).toEqual(expected)
    expect(root).toBe(getConfigurationRoot(expected))
    expect(expected.length).toBeGreaterThan(configurations.length)
  })

  it('counts the first-setup defaults towards the maximum', () => {
    const defaults = withFirstSetupDefaults(chainId, safeAddress, []).length
    const many = Array.from({ length: MAX_POLICY_CONFIGURATIONS - defaults + 1 }, (_, i) => ({
      ...configurations[0],
      target: getAddress(`0x${(i + 1).toString(16).padStart(40, '0')}`),
    }))

    expect(() => setup({ status: 'known', guardAddress }, many)).not.toThrow()
    expect(() => setup({ status: 'none' }, many)).toThrow(TOO_MANY_CONFIGURATIONS_ERROR)
    expect(() => setup({ status: 'none' }, many.slice(1))).not.toThrow()
  })

  it('should refuse a first setup, when it needs more gas than one transaction holds', () => {
    const recipients = Array.from({ length: 140 }, () => getAddress(faker.finance.ethereumAddress()))
    const large = [{ ...configurations[0], data: encodeErc20TransferPolicyData(recipients) }]

    expect(() => setup({ status: 'none' }, large)).toThrow(TRANSACTION_TOO_LARGE_ERROR)
  })

  it('should refuse a change, when its later apply needs more gas than one transaction holds', () => {
    const recipients = Array.from({ length: 146 }, () => getAddress(faker.finance.ethereumAddress()))
    const large = [{ ...configurations[0], data: encodeErc20TransferPolicyData(recipients) }]

    expect(() => setup({ status: 'known', guardAddress }, large)).toThrow(TRANSACTION_TOO_LARGE_ERROR)
  })

  it('only requests the configuration root when both slots are set', () => {
    const txs = build({ status: 'known', guardAddress })

    expect(describeCalls({ status: 'known', guardAddress })).toEqual([
      { to: guardAddress, name: 'requestConfiguration' },
    ])
    expect(iface.parseTransaction({ data: txs[0].data })?.args[0]).toBe(getConfigurationRoot(configurations))
  })

  it('requests the configuration before setting the missing transaction guard', () => {
    expect(describeCalls({ status: 'partial', missingSlot: 'transaction', guardAddress })).toEqual([
      { to: guardAddress, name: 'requestConfiguration' },
      { to: safeAddress, name: 'setGuard' },
    ])

    const txs = build({ status: 'partial', missingSlot: 'transaction', guardAddress })
    expect(iface.parseTransaction({ data: txs[0].data })?.args[0]).toBe(getConfigurationRoot(configurations))
    expect(iface.parseTransaction({ data: txs[1].data })?.args[0]).toBe(guardAddress)
  })

  it('requests the configuration before setting the missing module guard', () => {
    expect(describeCalls({ status: 'partial', missingSlot: 'module', guardAddress })).toEqual([
      { to: guardAddress, name: 'requestConfiguration' },
      { to: safeAddress, name: 'setModuleGuard' },
    ])

    const txs = build({ status: 'partial', missingSlot: 'module', guardAddress })
    expect(iface.parseTransaction({ data: txs[0].data })?.args[0]).toBe(getConfigurationRoot(configurations))
    expect(iface.parseTransaction({ data: txs[1].data })?.args[0]).toBe(guardAddress)
  })

  it.each<PolicyGuardState>([
    { status: 'known', guardAddress },
    { status: 'partial', missingSlot: 'module', guardAddress },
  ])('returns only the given configurations and their root for $status, adding no defaults', (guardState) => {
    const { configurations: requested, root } = setup(guardState)

    expect(requested).toEqual(configurations)
    expect(root).toBe(getConfigurationRoot(configurations))
  })

  it('targets the installed guard, not the configured one, when finishing a partial setup', () => {
    const installed = getAddress(faker.finance.ethereumAddress())
    const guardState: PolicyGuardState = { status: 'partial', missingSlot: 'module', guardAddress: installed }
    const txs = createAllowlistSetupTxs({
      chainId,
      safeAddress,
      guardAddress: installed,
      guardState,
      configurations,
    }).txs

    expect(txs.map((tx) => ({ to: tx.to, name: iface.parseTransaction({ data: tx.data })?.name }))).toEqual([
      { to: installed, name: 'requestConfiguration' },
      { to: safeAddress, name: 'setModuleGuard' },
    ])
    expect(iface.parseTransaction({ data: txs[1].data })?.args[0]).toBe(installed)
  })

  it('throws for a foreign guard', () => {
    expect(() => build({ status: 'unknown', foreignGuards: [] })).toThrow(GUARD_NOT_SUPPORTED_ERROR)
  })

  it('throws for an unsupported Safe', () => {
    expect(() => build({ status: 'unsupported' })).toThrow(GUARD_NOT_SUPPORTED_ERROR)
  })
})
