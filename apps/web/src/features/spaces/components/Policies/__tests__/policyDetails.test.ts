import { PolicyType } from '@safe-global/store/gateway/policies/types'
import {
  allowPolicyBuilder,
  cosignerPolicyBuilder,
  pendingPolicyBuilder,
  policyInfoBuilder,
  recoveryPolicyBuilder,
  spendingLimitPolicyBuilder,
  tokenWithdrawPolicyBuilder,
} from '@/tests/builders/policies'
import type { PolicyRequest } from '../policyRequestStore'
import { toPendingDetail, toPolicyDetail } from '../policyDetails'

const SAFE = { chainId: '1', address: '0x1111111111111111111111111111111111111111', name: 'Ops Safe' }

describe('toPolicyDetail', () => {
  it('maps a spending limit', () => {
    const policy = spendingLimitPolicyBuilder().build()

    expect(toPolicyDetail(policy, SAFE)).toMatchObject({
      type: 'spending-limit',
      beneficiary: policy.data.beneficiary,
      safe: SAFE,
    })
  })

  it('maps recovery, carrying the delay module address from the enforcement', () => {
    const policy = recoveryPolicyBuilder().build()
    const moduleAddress = policy.enforcement.via === 'module' ? policy.enforcement.moduleAddress : ''

    expect(toPolicyDetail(policy, SAFE)).toMatchObject({
      type: 'recovery',
      recoverer: policy.data.recoverers[0],
      config: { delayModifierAddress: moduleAddress },
    })
  })

  it('maps a token withdraw allowlist', () => {
    const policy = tokenWithdrawPolicyBuilder().build()

    expect(toPolicyDetail(policy, SAFE)).toMatchObject({
      type: 'ERC20TransferPolicy',
      allowlist: [{ token: { address: policy.data.allowlist[0].token.address } }],
    })
  })

  // No drawer view exists for these yet, so their rows aren't clickable.
  it('has no detail view for cosigner or the catch-all allow entry', () => {
    expect(toPolicyDetail(cosignerPolicyBuilder().build(), SAFE)).toBeNull()
    expect(toPolicyDetail(allowPolicyBuilder().build(), SAFE)).toBeNull()
  })
})

describe('toPendingDetail', () => {
  const localRequest = (): PolicyRequest => ({
    id: 'root-1',
    chainId: SAFE.chainId,
    safeAddress: SAFE.address,
    type: PolicyType.TokenWithdraw,
    enforcement: {
      via: 'guard',
      guards: {
        transactionGuard: {
          policyContract: '0x2222222222222222222222222222222222222222',
          safePolicyGuard: '0x3333333333333333333333333333333333333333',
        },
      },
    },
    data: {
      allowlist: [
        {
          token: { address: '0x4444444444444444444444444444444444444444', symbol: 'USDC', decimals: 6 },
          recipients: [{ address: '0x5555555555555555555555555555555555555555', name: 'Payroll' }],
        },
      ],
    },
    configurations: [],
    configureRoot: `0x${'ab'.repeat(32)}`,
    requestedAt: 1_000,
    readyAt: 1_000 + 86_400,
    delaySec: 86_400,
  })

  it('prefers the decoded policy CGW returned', () => {
    const pending = pendingPolicyBuilder().build()

    expect(toPendingDetail({ pending, safe: SAFE })).toMatchObject({ type: 'ERC20TransferPolicy' })
  })

  // The snapshot has token symbols and recipient names, which bindings don't.
  it('falls back to the local snapshot when CGW returns no decoded policy', () => {
    const pending = pendingPolicyBuilder().with({ policy: null }).build()

    expect(toPendingDetail({ pending, local: localRequest(), safe: SAFE })).toMatchObject({
      type: 'ERC20TransferPolicy',
      allowlist: [{ token: { symbol: 'USDC' }, recipients: [{ name: 'Payroll' }] }],
    })
  })

  it('falls back to the raw bindings when nothing decoded the change', () => {
    const binding = policyInfoBuilder().build()
    const pending = pendingPolicyBuilder()
      .with({ policy: null, policies: [binding] })
      .build()

    expect(toPendingDetail({ pending, safe: SAFE })).toEqual({
      type: 'bindings',
      safe: SAFE,
      bindings: [binding],
    })
  })

  it('yields an empty bindings view when CGW knows nothing about the root', () => {
    const pending = pendingPolicyBuilder().with({ policy: null, policies: null }).build()

    expect(toPendingDetail({ pending, safe: SAFE })).toEqual({ type: 'bindings', safe: SAFE, bindings: [] })
  })
})
