import { render, waitFor } from '@/tests/test-utils'
import type { SafeTransaction } from '@safe-global/types-kit'
import { UpdateSafeReview } from './UpdateSafeReview'
import { SafeTxContext } from '../../SafeTxProvider'
import { createUpdateSafeTxs } from '@/services/tx/safeUpdateParams'
import { createTx } from '@/services/tx/tx-sender'

jest.mock('@/services/tx/safeUpdateParams')
jest.mock('@/services/tx/tx-sender')
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useChains')
jest.mock('@/components/tx/ReviewTransactionV2', () => ({
  __esModule: true,
  default: () => null,
}))

const mockCreateUpdateSafeTxs = jest.mocked(createUpdateSafeTxs)
const mockCreateTx = jest.mocked(createTx)
const mockUseSafeInfo = jest.requireMock('@/hooks/useSafeInfo').default as jest.Mock
const mockUseCurrentChain = jest.requireMock('@/hooks/useChains').useCurrentChain as jest.Mock

describe('UpdateSafeReview', () => {
  const setSafeTx = jest.fn()
  const setSafeTxError = jest.fn()

  const renderWithContext = () =>
    render(
      <SafeTxContext.Provider value={{ setSafeTx, setSafeTxError } as never}>
        <UpdateSafeReview onSubmit={jest.fn()} />
      </SafeTxContext.Provider>,
    )

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeInfo.mockReturnValue({ safe: { version: '1.4.1', chainId: '1' }, safeLoaded: true })
    mockUseCurrentChain.mockReturnValue({ chainId: '1', recommendedMasterCopyVersion: '1.5.0' })
  })

  it('sets the Safe transaction when tx creation succeeds', async () => {
    const migrationTx = { to: '0x6439e7ABD8Bb915A5263094784C5CF561c4172AC', data: '0xed007fc6', value: '0' }
    const safeTx = { data: migrationTx } as unknown as SafeTransaction
    mockCreateUpdateSafeTxs.mockResolvedValue([migrationTx as never])
    mockCreateTx.mockResolvedValue(safeTx)

    renderWithContext()

    await waitFor(() => expect(setSafeTx).toHaveBeenCalledWith(safeTx))
    expect(setSafeTxError).not.toHaveBeenCalled()
  })

  it('surfaces tx-creation failures via setSafeTxError instead of spinning forever', async () => {
    mockCreateUpdateSafeTxs.mockRejectedValue(new Error('no changeMasterCopy on this version'))

    renderWithContext()

    await waitFor(() => expect(setSafeTxError).toHaveBeenCalled())
    expect(setSafeTxError.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(setSafeTx).not.toHaveBeenCalled()
  })
})
