import { Interface } from 'ethers'
import type { GuardSetup } from '@safe-global/views/features/spaces/components/Policies/types'
import { computeConfigureRoot } from '../../shared/guardTx'
import { getPolicyDeployments } from '../../shared/policyDeployments'
import { buildGuardSetupTx } from '../buildGuardSetupTx'

const GUARD = '0x0000000000000000000000000000000000000Ab1'
const CONFIGURATIONS = [
  {
    target: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    selector: '0xa9059cbb',
    operation: 0 as const,
    policy: '0x25DDa3b8974a10E93ca188F9C149A42F938Bd187',
    data: '0x',
  },
]
const ROOT = computeConfigureRoot(CONFIGURATIONS)

const guardIface = new Interface([
  'function requestConfiguration(bytes32 configureRoot)',
  'function applyConfiguration(tuple(address target, bytes4 selector, uint8 operation, address policy, bytes data)[] configurations)',
])

const delayed = (overrides: Partial<Extract<GuardSetup, { flow: 'delayed' }>> = {}): GuardSetup => ({
  flow: 'delayed',
  status: 'pending-application',
  guard: GUARD,
  root: ROOT,
  configurations: CONFIGURATIONS,
  readyAt: 1,
  expiresAt: 2,
  transaction: null,
  ...overrides,
})

describe('buildGuardSetupTx', () => {
  it('applies the configurations on the guard holding the root', () => {
    const tx = buildGuardSetupTx(delayed(), '11155111', 'apply')

    expect(tx?.to).toBe(GUARD)
    expect(guardIface.parseTransaction({ data: tx?.data ?? '0x' })?.name).toBe('applyConfiguration')
  })

  it('requests the root again on the same guard', () => {
    const tx = buildGuardSetupTx(delayed({ status: 'expired' }), '11155111', 'request')

    expect(tx?.to).toBe(GUARD)
    expect(guardIface.parseTransaction({ data: tx?.data ?? '0x' })?.args[0]).toBe(ROOT)
  })

  it("requests a draft on the chain's guard deployment", () => {
    const tx = buildGuardSetupTx(delayed({ status: 'draft', guard: null }), '11155111', 'request')

    expect(tx?.to).toBe(getPolicyDeployments('11155111')?.safePolicyGuard)
  })

  it.each([
    ['without configurations', delayed({ configurations: null })],
    ['when the configurations hash to another root', delayed({ root: `0x${'00'.repeat(32)}` })],
    ['for a draft on a chain with no deployment', delayed({ status: 'draft', guard: null })],
  ])('builds nothing %s', (name, setup) => {
    const chainId = name.includes('no deployment') ? '10' : '11155111'
    expect(buildGuardSetupTx(setup, chainId, 'request')).toBeUndefined()
  })
})
