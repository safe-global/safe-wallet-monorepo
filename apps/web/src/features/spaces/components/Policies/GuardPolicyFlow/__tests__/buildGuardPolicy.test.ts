import type { Address } from 'viem'
import {
  GUARD_READ_ERROR,
  NO_POLICY_CONTRACTS_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import { INELIGIBILITY_TEXT } from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/constants'
import { buildGuardPolicy } from '../buildGuardPolicy'
import type { GuardPolicyContracts } from '../hooks/useGuardPolicyContracts'

const SAFE = '0x1111111111111111111111111111111111111111' as Address
const GUARD = '0x2222222222222222222222222222222222222222' as Address
const POLICY = '0x3333333333333333333333333333333333333333' as Address
const ALLOW = '0x4444444444444444444444444444444444444444' as Address

const contracts = (overrides: Partial<GuardPolicyContracts> = {}): GuardPolicyContracts => ({
  chainId: '11155111',
  safeAddress: SAFE,
  safePolicyGuard: GUARD,
  policyContract: POLICY,
  allowPolicy: ALLOW,
  currentGuard: undefined,
  currentModuleGuard: undefined,
  isGuardSet: false,
  isUnknownGuard: false,
  isUnsupportedVersion: false,
  isLoading: false,
  ...overrides,
})

describe('buildGuardPolicy', () => {
  it('hands the builder both guard slots and the default fallback', () => {
    const build = jest.fn().mockReturnValue({ txs: [], mode: 'request', configurations: [], configureRoot: '0x' })

    buildGuardPolicy(contracts({ currentGuard: GUARD, currentModuleGuard: GUARD }), build)

    expect(build).toHaveBeenCalledWith(
      expect.objectContaining({
        currentGuard: GUARD,
        currentModuleGuard: GUARD,
        safePolicyGuard: GUARD,
        fallbackPolicy: ALLOW,
      }),
      POLICY,
    )
  })

  it('builds nothing while the guards load', () => {
    const build = jest.fn()

    expect(buildGuardPolicy(contracts({ isLoading: true }), build)).toEqual({})
    expect(build).not.toHaveBeenCalled()
  })

  it.each([
    ['a Safe older than v1.5.0', { isUnsupportedVersion: true }, INELIGIBILITY_TEXT['unsupported-safe-version']],
    ['a failed module guard read', { guardError: new Error('RPC down') }, GUARD_READ_ERROR],
    ['a chain without the policy engine', { safePolicyGuard: undefined }, NO_POLICY_CONTRACTS_ERROR],
  ])('refuses to build for %s', (_, overrides, message) => {
    const build = jest.fn()

    expect(buildGuardPolicy(contracts(overrides), build).error?.message).toBe(message)
    expect(build).not.toHaveBeenCalled()
  })
})
