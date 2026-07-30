import { AbiCoder, Interface, getAddress } from 'ethers'
import type { Address } from 'viem'
import {
  APPLY_CONFIGURATION_ABI,
  CONFIGURE_IMMEDIATELY_ABI,
  REQUEST_CONFIGURATION_ABI,
  SAFE_SET_GUARD_ABI,
  computeConfigureRoot,
} from '../../shared/guardTx'
import { NO_SELECTOR, OPERATION_CALL, OPERATION_DELEGATECALL } from '../../shared/accessSelector'
import { buildCosignerBatch } from '../buildBatch'

const SAFE = '0x1111111111111111111111111111111111111111' as Address
const GUARD = '0x2222222222222222222222222222222222222222' as Address
const POLICY = '0x3333333333333333333333333333333333333333' as Address
const COSIGNER = '0x4444444444444444444444444444444444444444' as Address
const TARGET = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const OTHER_TARGET = '0x6b175474e89094c44da98b954eedeac495271d0f'
const TRANSFER = '0xa9059cbb'

const base = {
  safeAddress: SAFE,
  safePolicyGuard: GUARD,
  policyContract: POLICY,
  cosigner: COSIGNER,
  accesses: [{ target: TARGET, selector: TRANSFER, operation: OPERATION_CALL }],
}

describe('buildCosignerBatch', () => {
  it('installs the guard and configures immediately when no guard is set', () => {
    const { txs, mode } = buildCosignerBatch(base)

    expect(mode).toBe('immediate')
    expect(txs).toHaveLength(2)

    const [guardArg] = new Interface(SAFE_SET_GUARD_ABI).decodeFunctionData('setGuard', txs[0].data)
    expect(guardArg.toLowerCase()).toBe(GUARD.toLowerCase())
    expect(txs[1].to).toBe(GUARD)
  })

  // CoSignerPolicy.configure does `abi.decode(data, (address))` — nothing else.
  it('encodes the configuration data as a bare cosigner address', () => {
    const { txs, configurations } = buildCosignerBatch(base)

    expect(configurations).toHaveLength(1)
    expect(configurations[0]).toMatchObject({
      target: getAddress(TARGET),
      selector: TRANSFER,
      operation: OPERATION_CALL,
      policy: POLICY,
    })

    const [decoded] = AbiCoder.defaultAbiCoder().decode(['address'], configurations[0].data)
    expect(decoded.toLowerCase()).toBe(COSIGNER.toLowerCase())

    const [applied] = new Interface(CONFIGURE_IMMEDIATELY_ABI).decodeFunctionData('configureImmediately', txs[1].data)
    expect(applied).toHaveLength(1)
    expect(applied[0].policy.toLowerCase()).toBe(POLICY.toLowerCase())
  })

  // No selector = calls carrying no function data, i.e. a plain value transfer.
  it('treats an omitted selector as the no-data access', () => {
    const { configurations } = buildCosignerBatch({ ...base, accesses: [{ target: TARGET }] })

    expect(configurations[0].selector).toBe(NO_SELECTOR)
    expect(configurations[0].operation).toBe(OPERATION_CALL)
  })

  it('carries DELEGATECALL through as its own access', () => {
    const { configurations } = buildCosignerBatch({
      ...base,
      accesses: [{ target: TARGET, selector: TRANSFER, operation: OPERATION_DELEGATECALL }],
    })

    expect(configurations[0].operation).toBe(OPERATION_DELEGATECALL)
  })

  it('configures every access given, checksumming targets', () => {
    const { configurations } = buildCosignerBatch({
      ...base,
      accesses: [
        { target: TARGET, selector: TRANSFER },
        { target: OTHER_TARGET, selector: TRANSFER },
      ],
    })

    expect(configurations.map((c) => c.target)).toEqual([getAddress(TARGET), getAddress(OTHER_TARGET)])
    // Same cosigner payload on both.
    expect(new Set(configurations.map((c) => c.data)).size).toBe(1)
  })

  // Guard already live → configureImmediately reverts, so the change goes through the delay.
  it('requests the change when the policy guard is already active', () => {
    const { txs, mode, configurations, configureRoot } = buildCosignerBatch({ ...base, currentGuard: GUARD })

    expect(mode).toBe('request')
    expect(txs).toHaveLength(1)
    expect(txs[0].to).toBe(GUARD)

    const [root] = new Interface(REQUEST_CONFIGURATION_ABI).decodeFunctionData('requestConfiguration', txs[0].data)
    expect(root).toBe(configureRoot)
    expect(computeConfigureRoot(configurations)).toBe(configureRoot)
    expect(() =>
      new Interface(APPLY_CONFIGURATION_ABI).encodeFunctionData('applyConfiguration', [
        configurations.map((c) => [c.target, c.selector, c.operation, c.policy, c.data]),
      ]),
    ).not.toThrow()
  })

  it('refuses to overwrite a foreign guard unless confirmed', () => {
    const foreign = '0x9999999999999999999999999999999999999999' as Address

    expect(() => buildCosignerBatch({ ...base, currentGuard: foreign })).toThrow(/different transaction guard/i)
    expect(buildCosignerBatch({ ...base, currentGuard: foreign, allowOverwriteGuard: true }).mode).toBe('immediate')
  })

  it('rejects incomplete input', () => {
    expect(() => buildCosignerBatch({ ...base, accesses: [] })).toThrow(/at least one call/i)
    expect(() => buildCosignerBatch({ ...base, cosigner: '0xnope' as Address })).toThrow(/cosigner address/i)
    expect(() => buildCosignerBatch({ ...base, policyContract: '0xnope' as Address })).toThrow(/CoSignerPolicy/i)
    expect(() => buildCosignerBatch({ ...base, accesses: [{ target: '0xnope' }] })).toThrow(/Invalid target address/i)
    expect(() => buildCosignerBatch({ ...base, accesses: [{ target: TARGET, selector: '0xabc' }] })).toThrow(
      /Invalid function selector/i,
    )
  })
})
