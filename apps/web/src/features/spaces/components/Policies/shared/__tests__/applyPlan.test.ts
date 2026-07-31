import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { PendingPolicy, PolicyInfo } from '@safe-global/store/gateway/policies/types'
import { computeConfigureRoot, OPERATION_CALL, type PolicyConfiguration } from '../guardTx'
import { isRebuildable, matchesRoot, resolveApplyPlan, toConfigurations } from '../applyPlan'

const TOKEN = '0x1111111111111111111111111111111111111111'
const OTHER_TOKEN = '0x4444444444444444444444444444444444444444'
const POLICY = '0x2222222222222222222222222222222222222222'
const GUARD = '0x3333333333333333333333333333333333333333'
const TRANSFER = '0xa9059cbb'
const NOW = 1_700_000_000

const policyInfo = (overrides: Partial<PolicyInfo> = {}): PolicyInfo => ({
  id: `0x${'11'.repeat(32)}`,
  target: TOKEN,
  selector: TRANSFER,
  operation: 'CALL',
  policyContract: POLICY,
  data: '0x01',
  ...overrides,
})

/** A pending item whose root matches its own bindings, as CGW guarantees. */
const pendingFor = (policies: PolicyInfo[] | null, overrides: Partial<PendingPolicy> = {}): PendingPolicy => ({
  configureRoot: policies ? computeConfigureRoot(toConfigurations(policies)) : `0x${'ab'.repeat(32)}`,
  requestedAt: NOW - 86_400,
  readyAt: NOW - 1,
  isReady: true,
  safePolicyGuard: GUARD,
  policies,
  ...overrides,
})

describe('toConfigurations', () => {
  it('maps CGW bindings onto the on-chain struct', () => {
    expect(toConfigurations([policyInfo()])).toEqual([
      { target: TOKEN, selector: TRANSFER, operation: 0, policy: POLICY, data: '0x01' },
    ])
  })

  it('maps DELEGATECALL to 1', () => {
    expect(toConfigurations([policyInfo({ operation: 'DELEGATECALL' })])[0].operation).toBe(1)
  })

  // A null policyContract is a removal of that access's policy.
  it('maps a null policyContract to the zero address', () => {
    expect(toConfigurations([policyInfo({ policyContract: null })])[0].policy).toBe(ZERO_ADDRESS)
  })

  it('preserves order, because order fixes the root', () => {
    const first = policyInfo({ target: TOKEN })
    const second = policyInfo({ target: OTHER_TOKEN })

    expect(toConfigurations([first, second]).map((c) => c.target)).toEqual([TOKEN, OTHER_TOKEN])
    // Reordering the same bindings hashes differently, so the apply would revert.
    expect(computeConfigureRoot(toConfigurations([first, second]))).not.toBe(
      computeConfigureRoot(toConfigurations([second, first])),
    )
  })
})

describe('isRebuildable', () => {
  it('accepts complete bindings', () => {
    expect(isRebuildable([policyInfo()])).toBe(true)
  })

  // A CGW that predates the pending-details work returns bindings without `data`.
  it('rejects bindings whose payload is missing', () => {
    const { data: _data, ...withoutData } = policyInfo()
    expect(isRebuildable([withoutData as PolicyInfo])).toBe(false)
    expect(isRebuildable([policyInfo({ data: null })])).toBe(false)
  })

  it('rejects non-hex fields', () => {
    expect(isRebuildable([policyInfo({ data: 'not-hex' })])).toBe(false)
    expect(isRebuildable([policyInfo({ selector: '' })])).toBe(false)
  })
})

describe('matchesRoot', () => {
  it('round-trips CGW bindings back to the requested root', () => {
    const policies = [policyInfo(), policyInfo({ target: OTHER_TOKEN, data: '0x02' })]
    const root = computeConfigureRoot(toConfigurations(policies))

    expect(matchesRoot(toConfigurations(policies), root)).toBe(true)
  })

  // This runs during render, so a payload the ABI coder rejects must not throw.
  it('returns false instead of throwing on an unencodable payload', () => {
    const broken = [{ target: TOKEN, selector: TRANSFER, operation: 0, policy: POLICY, data: null }]

    expect(() => matchesRoot(broken as unknown as PolicyConfiguration[], `0x${'ab'.repeat(32)}`)).not.toThrow()
    expect(matchesRoot(broken as unknown as PolicyConfiguration[], `0x${'ab'.repeat(32)}`)).toBe(false)
  })

  it('ignores root casing', () => {
    const policies = [policyInfo()]
    const root = computeConfigureRoot(toConfigurations(policies))

    expect(matchesRoot(toConfigurations(policies), root.toUpperCase().replace('0X', '0x'))).toBe(true)
  })
})

describe('resolveApplyPlan', () => {
  const localConfigurations: PolicyConfiguration[] = [
    { target: TOKEN, selector: TRANSFER, operation: OPERATION_CALL, policy: POLICY, data: '0x01' },
  ]

  it('applies from CGW bindings, with no local snapshot needed', () => {
    const policies = [policyInfo()]

    expect(resolveApplyPlan({ pending: pendingFor(policies), nowSec: NOW })).toEqual({
      canApply: true,
      guard: GUARD,
      configurations: toConfigurations(policies),
      source: 'cgw',
    })
  })

  it('prefers CGW bindings over the local snapshot', () => {
    const policies = [policyInfo({ data: '0x02' })]

    const plan = resolveApplyPlan({
      pending: pendingFor(policies),
      local: { configurations: localConfigurations, guard: GUARD },
      nowSec: NOW,
    })

    expect(plan).toMatchObject({ canApply: true, source: 'cgw' })
  })

  // Older CGW: no bindings, so only the requesting device can apply.
  it('falls back to the local snapshot when CGW has no bindings', () => {
    const pending = pendingFor(null, {
      configureRoot: computeConfigureRoot(localConfigurations),
      safePolicyGuard: undefined,
    })

    expect(
      resolveApplyPlan({ pending, local: { configurations: localConfigurations, guard: GUARD }, nowSec: NOW }),
    ).toEqual({ canApply: true, guard: GUARD, configurations: localConfigurations, source: 'local' })
  })

  it('blocks while the delay has not elapsed', () => {
    const pending = pendingFor([policyInfo()], { isReady: false, readyAt: NOW + 3600 })

    expect(resolveApplyPlan({ pending, nowSec: NOW })).toEqual({ canApply: false, reason: 'not-ready' })
  })

  // The root reaches the guard only when the request transaction executes.
  it('blocks while the request transaction has not executed', () => {
    const pending = pendingFor([policyInfo()], { isRootConfigured: false, isReady: false, readyAt: null })

    expect(resolveApplyPlan({ pending, nowSec: NOW })).toEqual({ canApply: false, reason: 'root-not-configured' })
  })

  // A CGW that predates the flag only ever lists requests that are already on-chain.
  it('treats a missing isRootConfigured as configured', () => {
    const pending = pendingFor([policyInfo()], { isRootConfigured: undefined })

    expect(resolveApplyPlan({ pending, nowSec: NOW })).toMatchObject({ canApply: true })
  })

  // Without a readyAt there is no delay to compare against, so it can't be ready.
  it('blocks when the delay is unknown', () => {
    const pending = pendingFor([policyInfo()], { isReady: false, readyAt: null })

    expect(resolveApplyPlan({ pending, nowSec: NOW })).toEqual({ canApply: false, reason: 'not-ready' })
  })

  it('lets the local clock overrule a stale isReady: false', () => {
    const pending = pendingFor([policyInfo()], { isReady: false, readyAt: NOW - 1 })

    expect(resolveApplyPlan({ pending, nowSec: NOW })).toMatchObject({ canApply: true })
  })

  // Regression: bindings without `data` used to reach the ABI coder and throw mid-render.
  it('blocks, without throwing, when CGW omits the payload', () => {
    const { data: _data, ...withoutData } = policyInfo()
    const pending = pendingFor([withoutData as PolicyInfo])

    expect(() => resolveApplyPlan({ pending, nowSec: NOW })).not.toThrow()
    expect(resolveApplyPlan({ pending, nowSec: NOW })).toEqual({
      canApply: false,
      reason: 'incomplete-configurations',
    })
  })

  it('falls back to the local snapshot when CGW omits the payload', () => {
    const { data: _data, ...withoutData } = policyInfo()
    const pending = pendingFor([withoutData as PolicyInfo], {
      configureRoot: computeConfigureRoot(localConfigurations),
    })

    expect(
      resolveApplyPlan({ pending, local: { configurations: localConfigurations, guard: GUARD }, nowSec: NOW }),
    ).toMatchObject({ canApply: true, source: 'local' })
  })

  it('blocks when neither CGW nor this browser holds the payload', () => {
    expect(resolveApplyPlan({ pending: pendingFor(null), nowSec: NOW })).toEqual({
      canApply: false,
      reason: 'no-configurations',
    })
  })

  it('treats an empty bindings array as no payload', () => {
    expect(resolveApplyPlan({ pending: pendingFor([]), nowSec: NOW })).toEqual({
      canApply: false,
      reason: 'no-configurations',
    })
  })

  // Corrupted data → the rebuilt structs hash to something else → the tx would revert.
  it('blocks when the bindings do not hash to the root', () => {
    const pending = pendingFor([policyInfo()])
    const corrupted = { ...pending, policies: [policyInfo({ data: '0xdead' })] }

    expect(resolveApplyPlan({ pending: corrupted, nowSec: NOW })).toEqual({
      canApply: false,
      reason: 'root-mismatch',
    })
  })

  it('blocks a local snapshot that does not hash to the root', () => {
    const pending = pendingFor(null, { safePolicyGuard: GUARD })

    expect(
      resolveApplyPlan({ pending, local: { configurations: localConfigurations, guard: GUARD }, nowSec: NOW }),
    ).toEqual({ canApply: false, reason: 'root-mismatch' })
  })

  it('blocks when no guard address is known', () => {
    const policies = [policyInfo()]
    const pending = pendingFor(policies, { safePolicyGuard: undefined })

    expect(resolveApplyPlan({ pending, nowSec: NOW })).toEqual({ canApply: false, reason: 'no-guard' })
  })

  it('falls back to the local guard when CGW omits it', () => {
    const policies = [policyInfo()]
    const pending = pendingFor(policies, { safePolicyGuard: undefined })

    expect(
      resolveApplyPlan({ pending, local: { configurations: localConfigurations, guard: GUARD }, nowSec: NOW }),
    ).toMatchObject({ canApply: true, guard: GUARD, source: 'cgw' })
  })
})
