import { fireEvent, render, screen } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { TX_LIST_EVENTS } from '@/services/analytics/events/txList'
import CsvTxExportButton from '../index'
import * as csvExportQueries from '@safe-global/store/gateway/AUTO_GENERATED/csv-export'

jest.mock('@/services/analytics', () =>
  (
    jest.requireActual('@safe-global/test/mocks/analytics') as { createAnalyticsMock: () => object }
  ).createAnalyticsMock(),
)

jest.mock('@/components/common/OnlyOwner', () => {
  return function MockOnlyOwner({ children }: { children: (isOk: boolean) => React.ReactNode }) {
    return <>{children(true)}</>
  }
})

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

describe('CsvTxExportButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(csvExportQueries, 'useCsvExportGetExportStatusV1Query').mockImplementation(() => ({
      data: undefined,
      refetch: jest.fn(),
    }))
  })

  it('should track CSV_EXPORT_CLICKED event when export button is clicked', () => {
    const { getByText } = render(<CsvTxExportButton hasActiveFilter={false} />)

    const exportButton = getByText('Export')
    fireEvent.click(exportButton)

    expect(mockTrackEvent).toHaveBeenCalledWith(TX_LIST_EVENTS.CSV_EXPORT_CLICKED)
  })

  it('should render export button correctly', () => {
    const { getByText } = render(<CsvTxExportButton hasActiveFilter={false} />)

    expect(getByText('Export')).toBeInTheDocument()
  })

  it('should open CSV export modal when export button is clicked', () => {
    const { getByText } = render(<CsvTxExportButton hasActiveFilter={false} />)

    const exportButton = getByText('Export')
    fireEvent.click(exportButton)

    expect(screen.getByLabelText('Date range')).toBeInTheDocument()
    expect(
      screen.getByText('The CSV includes transactions from the selected period, suitable for reporting.'),
    ).toBeInTheDocument()
  })

  it('should pass hasActiveFilter prop to modal correctly', () => {
    const { getByText } = render(<CsvTxExportButton hasActiveFilter={true} />)

    const exportButton = getByText('Export')
    fireEvent.click(exportButton)

    expect(screen.getByText("Transaction history filters won't apply here.")).toBeInTheDocument()
  })
})
