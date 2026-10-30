import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@/tests/test-utils'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { SafeTxContext, type SafeTxContextParams } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import {
  GUARD_NOT_SUPPORTED_ERROR,
  GUARD_READ_ERROR,
  GUARD_UNAVAILABLE_ERROR,
  ALLOWLIST_UNAVAILABLE_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { AllowlistRule } from '../../types'
import { useLoadFeature } from '@/features/__core__'
import { usePolicyGuard, type UsePolicyGuardResult } from '@/features/policy-guard'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender/create'
import { useBuildAllowlistTransaction } from '../useBuildAllowlistTransaction'

const mockServices = jest.requireActual('@/features/policy-guard/services/allowlistConfigurations')
const mockSetup = jest.requireActual('@/features/policy-guard/services/createAllowlistSetupTxs')
const { withFirstSetupDefaults } = jest.requireActual('@/features/policy-guard/services/firstSetupDefaults')
const { getConfigurationRoot } = jest.requireActual('@/features/policy-guard/services/policyGuardEncoders')

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
const mockConfiguredGuard = jest.fn()
jest.mock('@/features/policy-guard/services', () => {
  const actual = jest.requireActual('@/features/policy-guard/services')
  return { ...actual, getPolicyGuardAddress: (chainId: string) => mockConfiguredGuard(chainId) }
})
jest.mock('@/services/tx/tx-sender/create', () => ({ createMultiSendCallOnlyTx: jest.fn() }))

const CHAIN_ID = '11155111'
const GUARD_180 = '0x4d1fB05cc9bcd31cCA651B2833b4E71229c31d1f'
const GUARD_600 = '0x46d22E0B3DC367b48bc2d64B789ae154b3177a57'
const SAFE = '0x0000000000000000000000000000000000000001'
const TOKEN = '0x0000000000000000000000000000000000000abc'
const RECIPIENT = '0x0000000000000000000000000000000000000def'
const scope = { chainId: CHAIN_ID, safeAddress: SAFE, sdk: {} }
const erc20Rules: AllowlistRule[] = [{ tokenAddress: TOKEN, recipients: [RECIPIENT] }]
const nativeRules: AllowlistRule[] = [{ tokenAddress: ZERO_ADDRESS, recipients: [RECIPIENT] }]
const builtTx = { data: { to: SAFE } }

const setSafeTx = jest.fn()
const setSafeTxError = jest.fn()
const wrapper = ({ children }: { children: ReactNode }) => (
  <SafeTxContext.Provider value={{ setSafeTx, setSafeTxError } as unknown as SafeTxContextParams}>
    {children}
  </SafeTxContext.Provider>
)

const mockGuard = (result: Partial<UsePolicyGuardResult>) =>
  (usePolicyGuard as jest.Mock).mockReturnValue({ isLoading: false, isRetrying: false, refetch: jest.fn(), ...result })

const mockFeature = (isReady = true) =>
  (useLoadFeature as jest.Mock).mockReturnValue({
    $isReady: isReady,
    buildAllowlistConfigurations: mockServices.buildAllowlistConfigurations,
    clearGuardExitConfigurations: mockServices.clearGuardExitConfigurations,
    createAllowlistSetupTxs: mockSetup.createAllowlistSetupTxs,
  })

const txSetCount = () => setSafeTx.mock.calls.filter(([tx]) => tx !== undefined).length
const sentBatch = () => (createMultiSendCallOnlyTx as jest.Mock).mock.calls.at(-1)[0] as unknown[]

describe('useBuildAllowlistTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockConfiguredGuard.mockImplementation((chainId: string) =>
      jest.requireActual('@/features/policy-guard/services').getPolicyGuardAddress(chainId),
    )
    ;(useSafeScope as jest.Mock).mockReturnValue(scope)
    ;(createMultiSendCallOnlyTx as jest.Mock).mockResolvedValue(builtTx)
    mockFeature()
  })

  it('sets a multisend of 3 calls when no guard is set up', async () => {
    mockGuard({ state: { status: 'none' } })
    const { result } = renderHook(() => useBuildAllowlistTransaction(erc20Rules), { wrapper })

    await waitFor(() => expect(setSafeTx).toHaveBeenCalledWith(builtTx))
    expect(sentBatch()).toHaveLength(3)
    expect(createMultiSendCallOnlyTx).toHaveBeenCalledWith(expect.any(Array), scope)
    expect(result.current.guardState).toEqual({ status: 'none' })
    const installed = withFirstSetupDefaults(CHAIN_ID, [
      ...mockServices.clearGuardExitConfigurations(SAFE),
      ...mockServices.buildAllowlistConfigurations(CHAIN_ID, erc20Rules),
    ])
    expect(result.current.configurations).toEqual(installed)
    expect(result.current.root).toBe(getConfigurationRoot(installed))
    expect(result.current.txs).toEqual(sentBatch())
  })

  it('should return the exit clean-up and the allowlist configurations, when the guard is already known', async () => {
    mockGuard({ state: { status: 'known', guardAddress: GUARD_180 } })
    const { result } = renderHook(() => useBuildAllowlistTransaction(erc20Rules), { wrapper })

    await waitFor(() => expect(result.current.configurations).toBeDefined())
    expect(result.current.configurations).toEqual([
      ...mockServices.clearGuardExitConfigurations(SAFE),
      ...mockServices.buildAllowlistConfigurations(CHAIN_ID, erc20Rules),
    ])
  })

  it('sets a single call to the guard when it is already known', async () => {
    mockGuard({ state: { status: 'known', guardAddress: GUARD_180 } })
    renderHook(() => useBuildAllowlistTransaction(erc20Rules), { wrapper })

    await waitFor(() => expect(setSafeTx).toHaveBeenCalledWith(builtTx))
    expect(sentBatch()).toHaveLength(1)
  })

  it('rebuilds when the guard state changes from none to known', async () => {
    mockGuard({ state: { status: 'none' } })
    const { rerender } = renderHook(() => useBuildAllowlistTransaction(erc20Rules), { wrapper })
    await waitFor(() => expect(txSetCount()).toBe(1))
    expect(sentBatch()).toHaveLength(3)

    mockGuard({ state: { status: 'known', guardAddress: GUARD_180 } })
    rerender()

    await waitFor(() => expect(txSetCount()).toBe(2))
    expect(sentBatch()).toHaveLength(1)
  })

  it('does not rebuild when the rules are re-created with the same values', async () => {
    mockGuard({ state: { status: 'known', guardAddress: GUARD_180 } })
    const { rerender } = renderHook(() => useBuildAllowlistTransaction(structuredClone(erc20Rules)), { wrapper })
    await waitFor(() => expect(txSetCount()).toBe(1))

    rerender()
    await waitFor(() => expect(txSetCount()).toBe(1))
    expect(createMultiSendCallOnlyTx).toHaveBeenCalledTimes(1)
  })

  it('keeps the transaction while the guard is re-read after a new Safe transaction', async () => {
    mockGuard({ state: { status: 'known', guardAddress: GUARD_180 } })
    const { result, rerender } = renderHook(() => useBuildAllowlistTransaction(erc20Rules), { wrapper })
    await waitFor(() => expect(txSetCount()).toBe(1))
    setSafeTx.mockClear()

    mockGuard({ isLoading: true })
    rerender()
    mockGuard({ state: { status: 'known', guardAddress: GUARD_180 } })
    rerender()

    expect(setSafeTx).not.toHaveBeenCalled()
    expect(result.current.txs).toHaveLength(1)
  })

  it('sets the error and no transaction when the guard read failed', () => {
    mockGuard({ error: new Error('rpc down') })
    const { result } = renderHook(() => useBuildAllowlistTransaction(erc20Rules), { wrapper })

    expect(setSafeTxError).toHaveBeenCalledWith(expect.objectContaining({ message: GUARD_READ_ERROR }))
    expect(setSafeTx).not.toHaveBeenCalledWith(expect.anything())
    expect(result.current.configurations).toBeUndefined()
  })

  it('sets the error and no transaction when the guard state is unknown', () => {
    mockGuard({ state: { status: 'unknown', foreignGuards: [{ slot: 'transaction', address: RECIPIENT }] } })
    const { result } = renderHook(() => useBuildAllowlistTransaction(erc20Rules), { wrapper })

    expect(setSafeTxError).toHaveBeenCalledWith(new Error(GUARD_NOT_SUPPORTED_ERROR))
    expect(setSafeTx).not.toHaveBeenCalledWith(expect.anything())
    expect(createMultiSendCallOnlyTx).not.toHaveBeenCalled()
    expect(result.current.configurations).toBeUndefined()
  })

  it('sets neither a transaction nor an error while the guard is loading', () => {
    mockGuard({ isLoading: true })
    renderHook(() => useBuildAllowlistTransaction(erc20Rules), { wrapper })

    expect(setSafeTx).not.toHaveBeenCalledWith(expect.anything())
    expect(setSafeTxError).not.toHaveBeenCalledWith(expect.anything())
  })

  it('sets neither a transaction nor an error while the feature is not ready', () => {
    mockFeature(false)
    mockGuard({ state: { status: 'none' } })
    renderHook(() => useBuildAllowlistTransaction(erc20Rules), { wrapper })

    expect(setSafeTx).not.toHaveBeenCalledWith(expect.anything())
    expect(setSafeTxError).not.toHaveBeenCalledWith(expect.anything())
  })

  it('sets the error when the configurations cannot be built', () => {
    ;(useLoadFeature as jest.Mock).mockReturnValue({
      $isReady: true,
      buildAllowlistConfigurations: () => {
        throw new Error(ALLOWLIST_UNAVAILABLE_ERROR)
      },
      clearGuardExitConfigurations: mockServices.clearGuardExitConfigurations,
      createAllowlistSetupTxs: mockSetup.createAllowlistSetupTxs,
    })
    mockGuard({ state: { status: 'none' } })
    const { result } = renderHook(() => useBuildAllowlistTransaction(nativeRules), { wrapper })

    expect(setSafeTxError).toHaveBeenCalledWith(expect.objectContaining({ message: ALLOWLIST_UNAVAILABLE_ERROR }))
    expect(setSafeTx).not.toHaveBeenCalledWith(expect.anything())
    expect(result.current.configurations).toBeUndefined()
  })

  it('sets the error when creating the transaction fails', async () => {
    mockGuard({ state: { status: 'known', guardAddress: GUARD_180 } })
    ;(createMultiSendCallOnlyTx as jest.Mock).mockRejectedValue(new Error('sdk failed'))
    const { result } = renderHook(() => useBuildAllowlistTransaction(erc20Rules), { wrapper })

    await waitFor(() => expect(setSafeTxError).toHaveBeenCalledWith(expect.objectContaining({ message: 'sdk failed' })))
    expect(setSafeTx).not.toHaveBeenCalledWith(expect.anything())
    expect(result.current.configurations).toBeUndefined()
  })

  it('clears the old transaction before setting the rebuilt one on none to known', async () => {
    mockGuard({ state: { status: 'none' } })
    const { rerender } = renderHook(() => useBuildAllowlistTransaction(erc20Rules), { wrapper })
    await waitFor(() => expect(setSafeTx).toHaveBeenCalledWith(builtTx))
    setSafeTx.mockClear()

    const knownTx = { data: { to: 'known' } }
    ;(createMultiSendCallOnlyTx as jest.Mock).mockResolvedValue(knownTx)
    mockGuard({ state: { status: 'known', guardAddress: GUARD_180 } })
    rerender()

    expect(setSafeTx).toHaveBeenNthCalledWith(1, undefined)
    await waitFor(() => expect(setSafeTx).toHaveBeenLastCalledWith(knownTx))
  })

  it('clears the transaction when the guard read then fails', async () => {
    mockGuard({ state: { status: 'known', guardAddress: GUARD_180 } })
    const { rerender } = renderHook(() => useBuildAllowlistTransaction(erc20Rules), { wrapper })
    await waitFor(() => expect(setSafeTx).toHaveBeenCalledWith(builtTx))
    setSafeTx.mockClear()

    mockGuard({ error: new Error('rpc down') })
    rerender()

    expect(setSafeTx).toHaveBeenCalledWith(undefined)
    expect(setSafeTxError).toHaveBeenLastCalledWith(expect.objectContaining({ message: GUARD_READ_ERROR }))
  })

  it('clears an earlier error when the guard read recovers', async () => {
    mockGuard({ error: new Error('rpc down') })
    const { rerender } = renderHook(() => useBuildAllowlistTransaction(erc20Rules), { wrapper })
    setSafeTxError.mockClear()

    mockGuard({ state: { status: 'known', guardAddress: GUARD_180 } })
    rerender()

    expect(setSafeTxError).toHaveBeenCalledWith(undefined)
    await waitFor(() => expect(setSafeTx).toHaveBeenCalledWith(builtTx))
    expect(setSafeTxError).not.toHaveBeenCalledWith(expect.any(Error))
  })

  it('builds a single call to the installed guard, when the Safe is on a guard of another delay', async () => {
    mockGuard({ state: { status: 'known', guardAddress: GUARD_600 } })
    renderHook(() => useBuildAllowlistTransaction(erc20Rules), { wrapper })

    await waitFor(() => expect(setSafeTx).toHaveBeenCalledWith(builtTx))
    expect(setSafeTxError).not.toHaveBeenCalledWith(expect.any(Error))
    expect(sentBatch()).toEqual([expect.objectContaining({ to: GUARD_600 })])
  })

  it('finishes a partial setup on the installed guard', async () => {
    mockGuard({ state: { status: 'partial', missingSlot: 'module', guardAddress: GUARD_600 } })
    renderHook(() => useBuildAllowlistTransaction(erc20Rules), { wrapper })

    await waitFor(() => expect(setSafeTx).toHaveBeenCalledWith(builtTx))
    expect(sentBatch()).toEqual([expect.objectContaining({ to: GUARD_600 }), expect.objectContaining({ to: SAFE })])
  })

  describe('when the configured delay has no deployment on the chain', () => {
    beforeEach(() => mockConfiguredGuard.mockReturnValue(undefined))

    it('sets the error when no guard is set up', () => {
      mockGuard({ state: { status: 'none' } })
      renderHook(() => useBuildAllowlistTransaction(erc20Rules), { wrapper })

      expect(setSafeTxError).toHaveBeenCalledWith(expect.objectContaining({ message: GUARD_UNAVAILABLE_ERROR }))
      expect(createMultiSendCallOnlyTx).not.toHaveBeenCalled()
    })

    it('still builds for a Safe on an installed guard', async () => {
      mockGuard({ state: { status: 'known', guardAddress: GUARD_600 } })
      renderHook(() => useBuildAllowlistTransaction(erc20Rules), { wrapper })

      await waitFor(() => expect(setSafeTx).toHaveBeenCalledWith(builtTx))
      expect(setSafeTxError).not.toHaveBeenCalledWith(expect.any(Error))
    })
  })

  it('sets the error when the chain has no policy guard', () => {
    ;(useSafeScope as jest.Mock).mockReturnValue({ ...scope, chainId: '100' })
    mockGuard({})
    renderHook(() => useBuildAllowlistTransaction(erc20Rules), { wrapper })

    expect(setSafeTxError).toHaveBeenCalledWith(expect.objectContaining({ message: GUARD_UNAVAILABLE_ERROR }))
    expect(setSafeTx).not.toHaveBeenCalledWith(builtTx)
  })
})
