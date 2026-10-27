import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { allowPolicyBuilder, tokenWithdrawPolicyBuilder } from '@/tests/builders/policies'
import { isSafeManagementPolicy, safeManagementFunctionOf } from '../identify'
import { SAFE_MANAGEMENT_FUNCTIONS } from '../contracts'

const SAFE = { chainId: '11155111', address: '0x1476fE1f6b95566e1b7aef9e22f814ed0152Dff2' }
const GUARD = { policyContract: '0x92e94Af03982C2486dffa8DcBc5d069D33996eF2', safePolicyGuard: '0x5202B1eb' }

const allowOn = (target: string, selector: string, operation: 'CALL' | 'DELEGATECALL' = 'CALL') =>
  allowPolicyBuilder()
    .with({
      safe: SAFE,
      enforcement: { via: 'guard', guards: { transactionGuard: GUARD }, access: { target, selector, operation } },
    })
    .build()

describe('safeManagementFunctionOf', () => {
  it.each(SAFE_MANAGEMENT_FUNCTIONS.map((fn) => [fn.id, fn.selector] as const))(
    'recognises %s on the Safe itself',
    (id, selector) => {
      expect(safeManagementFunctionOf(allowOn(SAFE.address, selector))?.id).toBe(id)
    },
  )

  it('matches the selector case-insensitively', () => {
    expect(safeManagementFunctionOf(allowOn(SAFE.address, '0x0D582F13'))?.id).toBe('addOwnerWithThreshold')
  })

  // An AllowPolicy on some other contract is not a Safe setting, even with a selector that
  // happens to collide with a management one.
  it('ignores an allow policy targeting another contract', () => {
    expect(
      safeManagementFunctionOf(allowOn('0x2222222222222222222222222222222222222222', '0x0d582f13')),
    ).toBeUndefined()
  })

  it('ignores a management selector bound to DELEGATECALL', () => {
    expect(safeManagementFunctionOf(allowOn(SAFE.address, '0x0d582f13', 'DELEGATECALL'))).toBeUndefined()
  })

  it('ignores a selector that is not a management function', () => {
    expect(safeManagementFunctionOf(allowOn(SAFE.address, '0xa9059cbb'))).toBeUndefined()
  })

  // Only AllowPolicy grants a management function; another policy on the same access means
  // something else entirely.
  it('ignores a non-allow policy on the same access', () => {
    const policy = tokenWithdrawPolicyBuilder()
      .with({
        safe: SAFE,
        enforcement: {
          via: 'guard',
          guards: { transactionGuard: GUARD },
          access: { target: SAFE.address, selector: '0x0d582f13', operation: 'CALL' },
        },
      })
      .build()

    expect(safeManagementFunctionOf(policy)).toBeUndefined()
  })

  it('ignores a policy with no access at all', () => {
    expect(safeManagementFunctionOf(allowPolicyBuilder().with({ safe: SAFE }).build())).toBeUndefined()
  })

  it('exposes a boolean form', () => {
    expect(isSafeManagementPolicy(allowOn(SAFE.address, '0x694e80c3'))).toBe(true)
    expect(isSafeManagementPolicy(allowOn(SAFE.address, '0xa9059cbb'))).toBe(false)
  })
})

describe('PolicyType.Allow guard', () => {
  it('only ever matches allow policies', () => {
    expect(allowOn(SAFE.address, '0x0d582f13').type).toBe(PolicyType.Allow)
  })
})
