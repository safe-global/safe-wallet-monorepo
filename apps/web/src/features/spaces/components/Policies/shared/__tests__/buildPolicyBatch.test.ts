import { Interface } from 'ethers'
import type { Address } from 'viem'
import {
  CONFIGURE_IMMEDIATELY_ABI,
  REQUEST_CONFIGURATION_ABI,
  SAFE_SET_GUARD_ABI,
  SAFE_SET_MODULE_GUARD_ABI,
  computeConfigureRoot,
  type PolicyConfiguration,
} from '../guardTx'
import { OPERATION_CALL } from '../accessSelector'
import { assemblePolicyBatch } from '../buildPolicyBatch'

const SAFE = '0x1111111111111111111111111111111111111111' as Address
const GUARD = '0x2222222222222222222222222222222222222222' as Address
const POLICY = '0x3333333333333333333333333333333333333333' as Address

const configurations: PolicyConfiguration[] = [
  { target: SAFE, selector: '0x0d582f13', operation: OPERATION_CALL, policy: POLICY, data: '0x' },
]

const context = { safeAddress: SAFE, safePolicyGuard: GUARD }

describe('assemblePolicyBatch', () => {
  /**
   * SafePolicyGuard.configureImmediately opens with
   * `require(!_isGuardEnabled(msg.sender), GuardAlreadyEnabled())`. Installing the guard
   * first therefore reverts the configure call and the whole batch with it, so the order
   * here is a contract requirement rather than a preference.
   */
  it('configures before installing the guard in both slots', () => {
    const { txs, mode } = assemblePolicyBatch(context, configurations)

    expect(mode).toBe('immediate')
    expect(txs).toHaveLength(3)

    expect(txs[0].to).toBe(GUARD)
    expect(() =>
      new Interface(CONFIGURE_IMMEDIATELY_ABI).decodeFunctionData('configureImmediately', txs[0].data),
    ).not.toThrow()

    expect(txs[1].to).toBe(SAFE)
    const [guardArg] = new Interface(SAFE_SET_GUARD_ABI).decodeFunctionData('setGuard', txs[1].data)
    expect(guardArg.toLowerCase()).toBe(GUARD.toLowerCase())

    expect(txs[2].to).toBe(SAFE)
    const [moduleGuardArg] = new Interface(SAFE_SET_MODULE_GUARD_ABI).decodeFunctionData('setModuleGuard', txs[2].data)
    expect(moduleGuardArg.toLowerCase()).toBe(GUARD.toLowerCase())
  })

  // Once the guard is live the immediate path is closed, so there is nothing to order.
  it('requests a delayed configuration when the guard is already the policy guard', () => {
    const { txs, mode, configureRoot } = assemblePolicyBatch({ ...context, currentGuard: GUARD }, configurations)

    expect(mode).toBe('request')
    expect(txs).toHaveLength(1)
    expect(txs[0].to).toBe(GUARD)

    const [root] = new Interface(REQUEST_CONFIGURATION_ABI).decodeFunctionData('requestConfiguration', txs[0].data)
    expect(root).toBe(configureRoot)
    expect(root).toBe(computeConfigureRoot(configurations))
  })

  it('requests a delayed configuration when only the module guard is the policy guard', () => {
    const { txs, mode } = assemblePolicyBatch({ ...context, currentModuleGuard: GUARD }, configurations)

    expect(mode).toBe('request')
    expect(txs).toHaveLength(1)
    expect(txs[0].to).toBe(GUARD)
  })

  it('refuses to silently replace a foreign module guard', () => {
    const foreign = '0x5555555555555555555555555555555555555555' as Address

    expect(() => assemblePolicyBatch({ ...context, currentModuleGuard: foreign }, configurations)).toThrow(
      /different guard/i,
    )
    expect(
      assemblePolicyBatch({ ...context, currentModuleGuard: foreign, allowOverwriteGuard: true }, configurations).txs,
    ).toHaveLength(3)
  })

  it('refuses to silently replace a foreign guard', () => {
    const foreign = '0x5555555555555555555555555555555555555555' as Address

    expect(() => assemblePolicyBatch({ ...context, currentGuard: foreign }, configurations)).toThrow(/different guard/i)
    expect(() =>
      assemblePolicyBatch({ ...context, currentGuard: foreign, allowOverwriteGuard: true }, configurations),
    ).not.toThrow()
  })

  // An overwrite still has to configure first: the foreign guard is not the policy guard,
  // so `_isGuardEnabled` is false until this batch's own setGuard runs.
  it('keeps the configure-first order when overwriting a foreign guard', () => {
    const foreign = '0x5555555555555555555555555555555555555555' as Address
    const { txs } = assemblePolicyBatch(
      { ...context, currentGuard: foreign, allowOverwriteGuard: true },
      configurations,
    )

    expect(txs.map((tx) => tx.to)).toEqual([GUARD, SAFE, SAFE])
  })

  it.each([
    ['no configurations', [] as PolicyConfiguration[], /at least one configuration/i],
    ['an invalid guard', configurations, /Missing or invalid SafePolicyGuard/i],
  ])('rejects %s', (name, configs, pattern) => {
    const ctx = name === 'an invalid guard' ? { ...context, safePolicyGuard: '0xnope' as Address } : context

    expect(() => assemblePolicyBatch(ctx, configs)).toThrow(pattern)
  })
})
