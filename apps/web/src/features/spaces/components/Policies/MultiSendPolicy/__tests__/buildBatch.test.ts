import { Interface } from 'ethers'
import type { Address } from 'viem'
import {
  CONFIGURE_IMMEDIATELY_ABI,
  REQUEST_CONFIGURATION_ABI,
  SAFE_SET_GUARD_ABI,
  computeConfigureRoot,
} from '../../shared/guardTx'
import { parseAccessId, accessId, OPERATION_DELEGATECALL } from '../../shared/accessSelector'
import { buildMultiSendPolicyBatch } from '../buildBatch'
import { MULTI_SEND_SELECTOR } from '../contracts'

const SAFE = '0x1111111111111111111111111111111111111111' as Address
const GUARD = '0x2222222222222222222222222222222222222222' as Address
const POLICY = '0x3333333333333333333333333333333333333333' as Address
const MULTI_SEND = '0x9641d764fc13c8b624c04430c7356c1c7c8102e2' as Address

const base = {
  safeAddress: SAFE,
  safePolicyGuard: GUARD,
  policyContract: POLICY,
  multiSendAddress: MULTI_SEND,
}

describe('buildMultiSendPolicyBatch', () => {
  it('installs the guard and configures immediately when no guard is set', () => {
    const { txs, mode } = buildMultiSendPolicyBatch(base)

    expect(mode).toBe('immediate')
    expect(txs).toHaveLength(3)

    const [guardArg] = new Interface(SAFE_SET_GUARD_ABI).decodeFunctionData('setGuard', txs[1].data)
    expect(guardArg.toLowerCase()).toBe(GUARD.toLowerCase())
  })

  // configure() rejects anything that isn't multiSend-on-DELEGATECALL, so a CALL binding
  // would revert on configuration rather than simply not matching.
  it('pins the access to multiSend on DELEGATECALL with no payload', () => {
    const { configurations } = buildMultiSendPolicyBatch(base)

    expect(configurations).toHaveLength(1)
    expect(configurations[0]).toMatchObject({
      selector: MULTI_SEND_SELECTOR,
      operation: OPERATION_DELEGATECALL,
      policy: POLICY,
      data: '0x',
    })
    expect(configurations[0].target.toLowerCase()).toBe(MULTI_SEND.toLowerCase())
  })

  it('round-trips through the packed access key with the delegatecall bit set', () => {
    const { configurations } = buildMultiSendPolicyBatch(base)
    const access = parseAccessId(accessId(configurations[0]))

    expect(access?.selector).toBe(MULTI_SEND_SELECTOR)
    expect(access?.operation).toBe(OPERATION_DELEGATECALL)
    expect(access?.target).toBe(MULTI_SEND.toLowerCase())
  })

  it('requests a delayed configuration when the policy guard is already active', () => {
    const { txs, mode, configurations, configureRoot } = buildMultiSendPolicyBatch({ ...base, currentGuard: GUARD })

    expect(mode).toBe('request')
    expect(txs).toHaveLength(1)

    const [root] = new Interface(REQUEST_CONFIGURATION_ABI).decodeFunctionData('requestConfiguration', txs[0].data)
    expect(root).toBe(configureRoot)
    expect(root).toBe(computeConfigureRoot(configurations))
  })

  it('refuses to silently replace a foreign guard', () => {
    const foreign = '0x5555555555555555555555555555555555555555' as Address

    expect(() => buildMultiSendPolicyBatch({ ...base, currentGuard: foreign })).toThrow(/different guard/i)
    expect(() => buildMultiSendPolicyBatch({ ...base, currentGuard: foreign, allowOverwriteGuard: true })).not.toThrow()
  })

  it('encodes the configuration the guard will receive', () => {
    const { txs } = buildMultiSendPolicyBatch(base)
    const [applied] = new Interface(CONFIGURE_IMMEDIATELY_ABI).decodeFunctionData('configureImmediately', txs[0].data)

    expect(applied).toHaveLength(1)
    expect(applied[0].selector).toBe(MULTI_SEND_SELECTOR)
    expect(Number(applied[0].operation)).toBe(OPERATION_DELEGATECALL)
  })

  it.each([
    ['MultiSendPolicy', { policyContract: '0xnope' as Address }],
    ['MultiSend', { multiSendAddress: '0xnope' as Address }],
    ['SafePolicyGuard', { safePolicyGuard: '0xnope' as Address }],
  ])('rejects an invalid %s address', (_name, override) => {
    expect(() => buildMultiSendPolicyBatch({ ...base, ...override })).toThrow(/Missing or invalid/)
  })
})
