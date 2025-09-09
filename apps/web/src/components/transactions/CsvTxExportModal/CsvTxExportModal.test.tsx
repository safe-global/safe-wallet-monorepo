import React, { act } from 'react'
import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { TX_LIST_EVENTS } from '@/services/analytics/events/txList'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import CsvTxExportModal from './index'
import * as csvExportQueries from '@safe-global/store/gateway/AUTO_GENERATED/csv-export'

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  MixpanelEventParams: {
    DATE_RANGE: 'Date Range',
  },
}))

const mockLaunchFunction = jest.fn().mockImplementation(() => ({
  unwrap: jest.fn().mockResolvedValue({ id: 'test-job-id', status: 'SUBMITTED' }),
}))
const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>
const onClose = jest.fn()
const onExport = jest.fn()

describe('CsvTxExportModal', () => {
  const renderComponent = (hasActiveFilter: boolean = false) =>
    render(<CsvTxExportModal onClose={onClose} onExport={onExport} hasActiveFilter={hasActiveFilter} />)

  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(csvExportQueries, 'useCsvExportLaunchExportV1Mutation').mockReturnValue([
      mockLaunchFunction,
      {
        isLoading: false,
        reset: jest.fn(),
      },
    ])
  })

  it('renders modal with message and disabled export button', () => {
    renderComponent()

    expect(
      screen.getByText('The CSV includes transactions from the selected period, suitable for reporting.'),
    ).toBeTruthy()
    expect(screen.queryByText("Transaction history filters won't apply here.")).not.toBeTruthy()
    expect(screen.getByLabelText('Date range')).toBeTruthy()

    const exportBtn = screen.getByRole('button', { name: 'Export' })
    expect(exportBtn).toBeDisabled()
  })

  it('enables export after selecting a preset range', () => {
    renderComponent()

    act(() => fireEvent.mouseDown(screen.getByLabelText('Date range')))
    act(() => fireEvent.click(screen.getByRole('option', { name: 'Last 30 days' })))

    expect(screen.getByRole('button', { name: 'Export' })).toBeEnabled()
  })

  it('requires both custom dates before enabling export', async () => {
    renderComponent()

    act(() => fireEvent.mouseDown(screen.getByLabelText('Date range')))
    act(() => fireEvent.click(screen.getByRole('option', { name: 'Custom' })))

    const exportBtn = screen.getByRole('button', { name: 'Export' })
    expect(exportBtn).toBeDisabled()

    await act(async () => fireEvent.change(screen.getByLabelText('From'), { target: { value: '01/02/2023' } }))
    expect(exportBtn).toBeDisabled()

    await act(async () => fireEvent.change(screen.getByLabelText('To'), { target: { value: '02/02/2023' } }))
    expect(exportBtn).toBeEnabled()

    expect(screen.getByText('You can select up to 12 months.')).toBeInTheDocument()
  })

  it('validates from/to date order', async () => {
    renderComponent()

    act(() => fireEvent.mouseDown(screen.getByLabelText('Date range')))
    act(() => fireEvent.click(screen.getByRole('option', { name: 'Custom' })))

    await act(async () => {
      fireEvent.change(screen.getByLabelText('From'), { target: { value: '02/02/2023' } })
      fireEvent.change(screen.getByLabelText('To'), { target: { value: '01/02/2023' } })
    })

    await waitFor(() => {
      expect(screen.getByLabelText('Must be before "To" date')).toBeInTheDocument()
      expect(screen.getByLabelText('Must be after "From" date')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled()
    })
  })

  it('limits custom date range to 12 months', async () => {
    renderComponent()

    act(() => fireEvent.mouseDown(screen.getByLabelText('Date range')))
    act(() => fireEvent.click(screen.getByRole('option', { name: 'Custom' })))

    expect(screen.getByText('You can select up to 12 months.')).toBeInTheDocument()

    await act(async () => {
      fireEvent.change(screen.getByLabelText('From'), { target: { value: '01/02/2022' } })
      fireEvent.change(screen.getByLabelText('To'), { target: { value: '02/03/2023' } })
    })

    await waitFor(() => {
      expect(screen.getByText('Date range cannot exceed 12 months.')).toBeInTheDocument()
      expect(screen.queryByText('You can select up to 12 months.')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled()
    })
  })

  it('shows warning when filters are active', () => {
    renderComponent(true)

    expect(screen.getByText("Transaction history filters won't apply here.")).toBeInTheDocument()
  })

  it('should track CSV_EXPORT_SUBMITTED event with DATE_RANGE parameter when form is submitted', async () => {
    renderComponent()

    act(() => fireEvent.mouseDown(screen.getByLabelText('Date range')))
    act(() => fireEvent.click(screen.getByRole('option', { name: 'Last 30 days' })))

    const exportBtn = screen.getByRole('button', { name: 'Export' })
    await act(async () => fireEvent.click(exportBtn))

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith(TX_LIST_EVENTS.CSV_EXPORT_SUBMITTED, {
        [MixpanelEventParams.DATE_RANGE]: 'Last 30 days',
      })
    })
  })
})
