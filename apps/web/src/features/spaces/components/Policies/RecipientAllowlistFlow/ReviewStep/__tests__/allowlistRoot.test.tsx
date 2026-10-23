import type { ReactNode } from 'react'
import { Interface } from 'ethers'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { SafeTxContext, type SafeTxContextParams } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import type { AllowlistRule } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'
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

describe('allowlist configuration root', () => {
  it('is the same root in the built requestConfiguration call and the saved request', async () => {
    const mutate = jest.fn().mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) })
    ;(useSafeScope as jest.Mock).mockReturnValue({ chainId: CHAIN_ID, safeAddress: SAFE, sdk: {} })
    ;(usePolicyGuard as jest.Mock).mockReturnValue({ state: { status: 'known' } })
    ;(createMultiSendCallOnlyTx as jest.Mock).mockResolvedValue({ data: { to: SAFE } })
    ;(usePoliciesCreateConfigurationRequestV1Mutation as jest.Mock).mockReturnValue([mutate, { isLoading: false }])
    ;(useCurrentSpaceId as jest.Mock).mockReturnValue('42')
    ;(useLoadFeature as jest.Mock).mockReturnValue({
      $isReady: true,
      buildAllowlistConfigurations: mockConfigs.buildAllowlistConfigurations,
      createAllowlistSetupTxs: mockSetup.createAllowlistSetupTxs,
      getConfigurationRoot: mockEncoders.getConfigurationRoot,
    })

    const build = renderHook(() => useBuildAllowlistTransaction(rules), { wrapper })
    await waitFor(() => expect(build.result.current.configurations).toBeDefined())
    const save = renderHook(() => useSaveAllowlistConfiguration(), { wrapper })
    await act(async () => {
      await save.result.current.save(build.result.current.configurations!)
    })

    const [[txs]] = (createMultiSendCallOnlyTx as jest.Mock).mock.calls
    const decoded = new Interface(['function requestConfiguration(bytes32 configureRoot)']).parseTransaction({
      data: txs[0].data,
    })
    const posted = mutate.mock.calls[0][0].createPolicyConfigurationRequestDto.root

    expect(posted).toMatch(/^0x[0-9a-f]{64}$/)
    expect(decoded?.args[0]).toBe(posted)
  })
})
