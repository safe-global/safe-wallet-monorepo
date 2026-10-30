import type { ReactNode } from 'react'
import { getAddress, Interface } from 'ethers'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { SafeTxContext, type SafeTxContextParams } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import type { AllowlistRule } from '../../types'
import { useLoadFeature } from '@/features/__core__'
import { usePolicyGuard } from '@/features/policy-guard'
import { useCurrentSpaceId } from '../../../../../hooks/useCurrentSpaceId'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender/create'
import { usePoliciesCreateConfigurationRequestV1Mutation } from '@/store/api/gateway/spacePolicies'
import { useSaveAllowlistConfiguration } from '../../hooks/useSaveAllowlistConfiguration'
import { useBuildAllowlistTransaction } from '../useBuildAllowlistTransaction'

const mockConfigs = jest.requireActual('@/features/policy-guard/services/allowlistConfigurations')
const mockSetup = jest.requireActual('@/features/policy-guard/services/createAllowlistSetupTxs')
const mockEncoders = jest.requireActual('@/features/policy-guard/services/policyGuardEncoders')

jest.mock('@safe-global/views/components/tx-flow/safe-scope', () => ({
  ...jest.requireActual('@safe-global/views/components/tx-flow/safe-scope'),
  useSafeScope: jest.fn(),
}))
jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: jest.fn(),
}))
jest.mock('@/features/policy-guard', () => ({
  ...jest.requireActual('@/features/policy-guard'),
  usePolicyGuard: jest.fn(),
}))
jest.mock('@/services/tx/tx-sender/create', () => ({ createMultiSendCallOnlyTx: jest.fn() }))
jest.mock('@/store/api/gateway/spacePolicies', () => ({ usePoliciesCreateConfigurationRequestV1Mutation: jest.fn() }))
jest.mock('../../../../../hooks/useCurrentSpaceId', () => ({ useCurrentSpaceId: jest.fn() }))

const CHAIN_ID = '11155111'
const SAFE = '0x0000000000000000000000000000000000000001'
const TOKEN = '0x0000000000000000000000000000000000000abc'
const RECIPIENT = '0x0000000000000000000000000000000000000def'
const rules: AllowlistRule[] = [{ tokenAddress: TOKEN, recipients: [RECIPIENT] }]

const wrapper = ({ children }: { children: ReactNode }) => (
  <SafeTxContext.Provider value={{ setSafeTx: jest.fn(), setSafeTxError: jest.fn() } as unknown as SafeTxContextParams}>
    {children}
  </SafeTxContext.Provider>
)

const GUARD = '0x4d1fB05cc9bcd31cCA651B2833b4E71229c31d1f'

const setUp = (status: 'none' | 'known') => {
  const mutate = jest.fn().mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) })
  ;(useSafeScope as jest.Mock).mockReturnValue({ chainId: CHAIN_ID, safeAddress: SAFE, sdk: {} })
  ;(usePolicyGuard as jest.Mock).mockReturnValue({
    state: status === 'known' ? { status, guardAddress: GUARD } : { status },
  })
  ;(createMultiSendCallOnlyTx as jest.Mock).mockResolvedValue({ data: { to: SAFE } })
  ;(usePoliciesCreateConfigurationRequestV1Mutation as jest.Mock).mockReturnValue([mutate, { isLoading: false }])
  ;(useCurrentSpaceId as jest.Mock).mockReturnValue('42')
  ;(useLoadFeature as jest.Mock).mockReturnValue({
    $isReady: true,
    buildAllowlistConfigurations: mockConfigs.buildAllowlistConfigurations,
    clearGuardExitConfigurations: mockConfigs.clearGuardExitConfigurations,
    createAllowlistSetupTxs: mockSetup.createAllowlistSetupTxs,
  })
  return mutate
}

const buildAndSave = async () => {
  const build = renderHook(() => useBuildAllowlistTransaction(rules), { wrapper })
  await waitFor(() => expect(build.result.current.configurations).toBeDefined())
  const { configurations, root } = build.result.current
  const save = renderHook(() => useSaveAllowlistConfiguration(), { wrapper })
  await act(async () => {
    await save.result.current.save({ configurations: configurations!, root: root! })
  })
  const [[txs]] = (createMultiSendCallOnlyTx as jest.Mock).mock.calls
  return txs
}

describe('allowlist configuration root', () => {
  beforeEach(() => jest.clearAllMocks())

  it('saves exactly what a first setup configures immediately, defaults included', async () => {
    const mutate = setUp('none')
    const txs = await buildAndSave()

    const configured = new Interface([
      'function configureImmediately(tuple(address target, bytes4 selector, uint8 operation, address policy, bytes data)[] configurations)',
    ]).parseTransaction({ data: txs[0].data })?.args[0]
    const { root, configurations: saved } = mutate.mock.calls[0][0].createPolicyConfigurationRequestDto

    expect(saved.length).toBeGreaterThan(rules.length)
    // ABI decoding checksums addresses, so compare them in that form
    const checksummed = saved.map((entry: { target: string; policy: string }) => ({
      ...entry,
      target: getAddress(entry.target),
      policy: getAddress(entry.policy),
    }))
    expect(checksummed).toEqual(
      configured.map(([target, selector, operation, policy, data]: [string, string, bigint, string, string]) => ({
        target,
        selector,
        operation: Number(operation),
        policy,
        data,
      })),
    )
    expect(root).toBe(mockEncoders.getConfigurationRoot(saved))
  })

  it('is the same root in the built requestConfiguration call and the saved request', async () => {
    const mutate = setUp('known')
    const txs = await buildAndSave()

    const decoded = new Interface(['function requestConfiguration(bytes32 configureRoot)']).parseTransaction({
      data: txs[0].data,
    })
    const { root: posted, configurations: saved } = mutate.mock.calls[0][0].createPolicyConfigurationRequestDto

    expect(posted).toMatch(/^0x[0-9a-f]{64}$/)
    expect(decoded?.args[0]).toBe(posted)
    expect(saved).toEqual([
      ...mockConfigs.clearGuardExitConfigurations(SAFE),
      ...mockConfigs.buildAllowlistConfigurations(CHAIN_ID, rules),
    ])
  })
})
