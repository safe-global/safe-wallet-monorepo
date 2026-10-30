import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { renderHook, waitFor } from '@/tests/test-utils'
import { SafeTxContext, type SafeTxContextParams } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { ALLOWLIST_UNAVAILABLE_ERROR } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { useLoadFeature } from '@/features/__core__'
import { createTx } from '@/services/tx/tx-sender/create'
import { useBuildRemoveAllowlistTransaction } from '../useBuildRemoveAllowlistTransaction'

const { createRequestConfigurationTx, getConfigurationRoot } = jest.requireActual(
  '@/features/policy-guard/services/policyGuardEncoders',
)
const { buildAllowlistRemovalConfigurations } = jest.requireActual(
  '@/features/policy-guard/services/allowlistConfigurations',
)

jest.mock('@safe-global/views/components/tx-flow/safe-scope', () => ({
  ...jest.requireActual('@safe-global/views/components/tx-flow/safe-scope'),
  useSafeScope: jest.fn(),
}))
jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: jest.fn(),
}))
jest.mock('@/services/tx/tx-sender/create', () => ({ createTx: jest.fn() }))

const CHAIN_ID = '11155111'
const SAFE = faker.finance.ethereumAddress()
const GUARD = faker.finance.ethereumAddress()
const rules = [
  { tokenAddress: faker.finance.ethereumAddress(), recipients: [faker.finance.ethereumAddress()] },
  { tokenAddress: ZERO_ADDRESS, recipients: [faker.finance.ethereumAddress()] },
]
const scope = { chainId: CHAIN_ID, safeAddress: SAFE, sdk: {} }
const builtTx = { data: { to: GUARD } }

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
    ;(useLoadFeature as jest.Mock).mockReturnValue({
      $isReady: true,
      buildAllowlistRemovalConfigurations,
      getConfigurationRoot,
      createRequestConfigurationTx,
    })
    ;(createTx as jest.Mock).mockResolvedValue(builtTx)
  })

  it('should request the root of the removal and return what CGW stores, when the Safe SDK is ready', async () => {
    const configurations = buildAllowlistRemovalConfigurations({
      chainId: CHAIN_ID,
      safeAddress: SAFE,
      rules,
    })
    const root = getConfigurationRoot(configurations)
    const { result } = renderHook(() => useBuildRemoveAllowlistTransaction(GUARD, rules), { wrapper })

    await waitFor(() => expect(result.current).toEqual({ root, configurations }))
    expect(setSafeTx).toHaveBeenCalledWith(builtTx)
    expect(createTx).toHaveBeenCalledWith(createRequestConfigurationTx(GUARD, root), undefined, scope)
  })

  it('should not build, when the Safe SDK is not ready', () => {
    ;(useSafeScope as jest.Mock).mockReturnValue({ ...scope, sdk: undefined })
    const { result } = renderHook(() => useBuildRemoveAllowlistTransaction(GUARD, rules), { wrapper })

    expect(createTx).not.toHaveBeenCalled()
    expect(result.current).toBeUndefined()
  })

  it('should set the error and return nothing, when the chain has no policy deployments', () => {
    ;(useSafeScope as jest.Mock).mockReturnValue({ ...scope, chainId: '999999' })
    const { result } = renderHook(() => useBuildRemoveAllowlistTransaction(GUARD, rules), { wrapper })

    expect(setSafeTxError).toHaveBeenCalledWith(new Error(ALLOWLIST_UNAVAILABLE_ERROR))
    expect(createTx).not.toHaveBeenCalled()
    expect(result.current).toBeUndefined()
  })

  it('should report the failure and return nothing, when the transaction cannot be built', async () => {
    const error = new Error('Could not encode')
    ;(createTx as jest.Mock).mockRejectedValue(error)
    const { result } = renderHook(() => useBuildRemoveAllowlistTransaction(GUARD, rules), { wrapper })

    await waitFor(() => expect(setSafeTxError).toHaveBeenCalledWith(error))
    expect(result.current).toBeUndefined()
  })
})
