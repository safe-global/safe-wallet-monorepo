import { render, screen } from '@testing-library/react'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import usePortfolioSummaries from '@/features/portfolio/public/hooks/usePortfolioSummaries'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import { formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'
import AggregatedBalance from '../AggregatedBalances'

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), pathname: '/spaces', query: {} }),
}))
jest.mock('@/store', () => ({ useAppSelector: () => 'USD' }))
jest.mock('@/store/api/gateway', () => ({ useGetMultipleSafeOverviewsQuery: jest.fn() }))
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [] }),
  useChain: () => undefined,
}))
jest.mock('@/features/portfolio/public/hooks/usePortfolioSummaries', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/hooks/safe-apps/useTxBuilderApp', () => ({ useTxBuilderApp: () => ({ link: {} }) }))
jest.mock('@/hooks/useUrlSpaceId', () => ({ useUrlSpaceId: () => undefined, withSpaceId: (query: object) => query }))
jest.mock('@/components/tx-flow', () => ({
  TxModalContext: jest.requireActual('react').createContext({ setTxFlow: jest.fn() }),
}))
jest.mock('@/components/tx-flow/flows/TokenTransferFlow', () => ({ TokenTransferFlow: () => null }))
jest.mock('@/components/common/QrCodeButton/QrModal', () => () => null)
jest.mock('../../../public/components/DashboardHeader', () => ({
  DashboardHeader: ({ value }: { value: string }) => <p>{value}</p>,
}))

const mockOverviewsQuery = useGetMultipleSafeOverviewsQuery as jest.Mock
const mockSummaries = usePortfolioSummaries as jest.Mock

const overviewOf = (safe: { chainId: string; address: string }, fiatTotal: string) => ({
  chainId: safe.chainId,
  address: { value: safe.address },
  fiatTotal,
})

const expectPlaceholder = () => {
  expect(screen.queryByText(/\$/)).not.toBeInTheDocument()
  expect(document.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
}

describe('AggregatedBalance', () => {
  const safes = [safeItemBuilder().build(), safeItemBuilder().build()]

  beforeEach(() => {
    jest.clearAllMocks()
    mockSummaries.mockReturnValue({ isEnabled: () => false, getSummary: () => undefined, isLoading: false })
  })

  it('shows a placeholder, not $0.00, while the Workspace Safes load', () => {
    mockOverviewsQuery.mockReturnValue({ currentData: [], isFetching: false })

    render(<AggregatedBalance safeItems={[]} safesLoading />)

    expectPlaceholder()
  })

  it('shows a placeholder, not $0.00, while the overviews of a new Safe list load', () => {
    mockOverviewsQuery.mockReturnValue({ data: [], currentData: undefined, isFetching: true, isLoading: false })

    render(<AggregatedBalance safeItems={safes} />)

    expectPlaceholder()
  })

  it('shows the total once the overviews load', () => {
    mockOverviewsQuery.mockReturnValue({
      currentData: [overviewOf(safes[0], '10'), overviewOf(safes[1], '5.5')],
      isFetching: false,
    })

    render(<AggregatedBalance safeItems={safes} />)

    expect(screen.getByRole('paragraph').textContent).toBe(formatCurrencyPrecise(15.5, 'USD'))
  })

  it('keeps the total on screen during a background refresh', () => {
    mockOverviewsQuery.mockReturnValue({ currentData: [overviewOf(safes[0], '10')], isFetching: true })

    render(<AggregatedBalance safeItems={safes} />)

    expect(screen.getByRole('paragraph').textContent).toBe(formatCurrencyPrecise(10, 'USD'))
  })

  it('shows $0.00 for a Workspace with no Safes', () => {
    mockOverviewsQuery.mockReturnValue({ currentData: [], isFetching: false })

    render(<AggregatedBalance safeItems={[]} />)

    expect(screen.getByRole('paragraph').textContent).toBe(formatCurrencyPrecise(0, 'USD'))
  })
})
