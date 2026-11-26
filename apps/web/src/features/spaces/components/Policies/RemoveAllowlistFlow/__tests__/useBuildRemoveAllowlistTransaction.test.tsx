import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { renderHook, waitFor } from '@/tests/test-utils'
import { SafeTxContext, type SafeTxContextParams } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import {
  ALLOWLIST_UNAVAILABLE_ERROR,
  TOO_MANY_RECIPIENTS_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { buildAllowlistRemovalConfigurations } from '@/features/policy-guard/public/services/allowlistConfigurations'
import { buildGuardRemovalCleanupConfigurations } from '@/features/policy-guard/public/services/guardRemoval'
import {
  createInvalidateRootTx,
  createRequestConfigurationTx,
  getConfigurationRoot,
} from '@/features/policy-guard/public/services/policyGuardEncoders'
import { useHeldRootsReader } from '@/features/policy-guard/public/hooks/useHeldRootsReader'
import * as useChainsModule from '@/hooks/useChains'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender/create'
import { useBuildRemoveAllowlistTransaction } from '../useBuildRemoveAllowlistTransaction'

jest.mock('@safe-global/views/components/tx-flow/safe-scope', () => ({
  ...jest.requireActual('@safe-global/views/components/tx-flow/safe-scope'),
  useSafeScope: jest.fn(),
}))
jest.mock('@/services/tx/tx-sender/create', () => ({ createMultiSendCallOnlyTx: jest.fn() }))
jest.mock('@/features/policy-guard/public/hooks/useHeldRootsReader', () => ({ useHeldRootsReader: jest.fn() }))

const CHAIN_ID = '11155111'
const SAFE = faker.finance.ethereumAddress()
const GUARD = faker.finance.ethereumAddress()
const rules = [
  { tokenAddress: faker.finance.ethereumAddress(), recipients: [faker.finance.ethereumAddress()] },
  { tokenAddress: ZERO_ADDRESS, recipients: [faker.finance.ethereumAddress()] },
]
const scope = { chainId: CHAIN_ID, safeAddress: SAFE, sdk: {} }
const builtTx = { data: { to: GUARD } }

const heldRoots = jest.fn()
const setSafeTx = jest.fn()
const setSafeTxError = jest.fn()
const wrapper = ({ children }: { children: ReactNode }) => (
  <SafeTxContext.Provider value={{ setSafeTx, setSafeTxError } as unknown as SafeTxContextParams}>
    {children}
  </SafeTxContext.Provider>
)

describe('useBuildRemoveAllowlistTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSafeScope as jest.Mock).mockReturnValue(scope)
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(true)
    ;(createMultiSendCallOnlyTx as jest.Mock).mockResolvedValue(builtTx)
    jest.mocked(useHeldRootsReader).mockReturnValue(heldRoots)
    heldRoots.mockResolvedValue([])
  })

  it('should, when the guard still holds the clean-up of an earlier removal, withdraw it before requesting both roots', async () => {
    const deletion = buildAllowlistRemovalConfigurations({ chainId: CHAIN_ID, safeAddress: SAFE, rules })
    const cleanupRoot = getConfigurationRoot(buildGuardRemovalCleanupConfigurations(CHAIN_ID, SAFE))
    heldRoots.mockResolvedValue([cleanupRoot])
    renderHook(() => useBuildRemoveAllowlistTransaction(GUARD, rules), { wrapper })

    await waitFor(() => expect(setSafeTx).toHaveBeenCalledWith(builtTx))
    expect(heldRoots).toHaveBeenCalledWith(GUARD, SAFE, [getConfigurationRoot(deletion), cleanupRoot])
    expect(createMultiSendCallOnlyTx).toHaveBeenCalledWith(
      [
        createInvalidateRootTx(GUARD, cleanupRoot),
        createRequestConfigurationTx(GUARD, getConfigurationRoot(deletion)),
        createRequestConfigurationTx(GUARD, cleanupRoot),
      ],
      scope,
    )
  })

  it('should request the deletion and the clean-up in one batch and return both for CGW, when the Safe SDK is ready', async () => {
    const deletion = buildAllowlistRemovalConfigurations({ chainId: CHAIN_ID, safeAddress: SAFE, rules })
    const cleanup = buildGuardRemovalCleanupConfigurations(CHAIN_ID, SAFE)
    const { result } = renderHook(() => useBuildRemoveAllowlistTransaction(GUARD, rules), { wrapper })

    await waitFor(() =>
      expect(result.current).toEqual([
        { configurations: deletion, root: getConfigurationRoot(deletion) },
        { configurations: cleanup, root: getConfigurationRoot(cleanup) },
      ]),
    )
    expect(setSafeTx).toHaveBeenCalledWith(builtTx)
    expect(createMultiSendCallOnlyTx).toHaveBeenCalledWith(
      [
        createRequestConfigurationTx(GUARD, getConfigurationRoot(deletion)),
        createRequestConfigurationTx(GUARD, getConfigurationRoot(cleanup)),
      ],
      scope,
    )
  })

  it('should not build, when the Safe SDK is not ready', () => {
    ;(useSafeScope as jest.Mock).mockReturnValue({ ...scope, sdk: undefined })
    const { result } = renderHook(() => useBuildRemoveAllowlistTransaction(GUARD, rules), { wrapper })

    expect(createMultiSendCallOnlyTx).not.toHaveBeenCalled()
    expect(result.current).toBeUndefined()
  })

  it('should set the error and return nothing, when the chain has no policy deployments', () => {
    ;(useSafeScope as jest.Mock).mockReturnValue({ ...scope, chainId: '999999' })
    const { result } = renderHook(() => useBuildRemoveAllowlistTransaction(GUARD, rules), { wrapper })

    expect(setSafeTxError).toHaveBeenCalledWith(new Error(ALLOWLIST_UNAVAILABLE_ERROR))
    expect(createMultiSendCallOnlyTx).not.toHaveBeenCalled()
    expect(result.current).toBeUndefined()
  })

  it('should set the error and return nothing, when a token has more recipients than one rule can revoke', () => {
    const recipients = Array.from({ length: 1024 }, () => faker.finance.ethereumAddress())
    const { result } = renderHook(
      () => useBuildRemoveAllowlistTransaction(GUARD, [{ tokenAddress: faker.finance.ethereumAddress(), recipients }]),
      { wrapper },
    )

    expect(setSafeTxError).toHaveBeenCalledWith(new Error(TOO_MANY_RECIPIENTS_ERROR))
    expect(createMultiSendCallOnlyTx).not.toHaveBeenCalled()
    expect(result.current).toBeUndefined()
  })

  it('should report the failure and return nothing, when the transaction cannot be built', async () => {
    const error = new Error('Could not encode')
    ;(createMultiSendCallOnlyTx as jest.Mock).mockRejectedValue(error)
    const { result } = renderHook(() => useBuildRemoveAllowlistTransaction(GUARD, rules), { wrapper })

    await waitFor(() => expect(setSafeTxError).toHaveBeenCalledWith(error))
    expect(result.current).toBeUndefined()
  })
})
