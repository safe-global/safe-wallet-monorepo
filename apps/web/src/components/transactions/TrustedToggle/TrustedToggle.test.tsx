import { renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import * as useChains from '@/hooks/useChains'
import useLoadTxHistory from '@/hooks/loadables/useLoadTxHistory'
import { getTxHistory } from '@/services/transactions'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { initialState } from '@/store/settingsSlice'
import TrustedToggle from '.'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/services/transactions')

const mockGetTxHistory = jest.mocked(getTxHistory)

const HistoryLoader = () => {
  useLoadTxHistory()
  return null
}

const renderToggle = (hideSuspiciousTransactions: boolean) =>
  renderWithUserEvent(
    <>
      <TrustedToggle />
      <HistoryLoader />
    </>,
    { initialReduxState: { settings: { ...initialState, hideSuspiciousTransactions } } },
  )

describe('TrustedToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetTxHistory.mockResolvedValue({ results: [] })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('loads only trusted transactions after the user hides suspicious ones', async () => {
    jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => feature === FEATURES.DEFAULT_TOKENLIST)
    const safe = mockSafeInfo({ deployed: true })
    const { user } = renderToggle(false)
    await waitFor(() =>
      expect(mockGetTxHistory).toHaveBeenLastCalledWith(safe.chainId, safe.address.value, false, false),
    )

    await user.click(screen.getByRole('switch', { name: 'Hide suspicious' }))

    await waitFor(() => expect(mockGetTxHistory).toHaveBeenLastCalledWith(safe.chainId, safe.address.value, true, true))
  })

  it('is not shown on a chain without the default token list', () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)
    mockSafeInfo({ deployed: true })

    renderToggle(false)

    expect(screen.queryByRole('switch', { name: 'Hide suspicious' })).not.toBeInTheDocument()
  })
})
