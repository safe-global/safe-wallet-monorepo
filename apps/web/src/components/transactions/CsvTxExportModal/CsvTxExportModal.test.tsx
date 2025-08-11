import React, { act } from 'react'
import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import CsvTxExportModal from './index'

const onClose = jest.fn()

describe('CsvTxExportModal', () => {
  const renderComponent = (hasActiveFilter: boolean = false) =>
    render(<CsvTxExportModal onClose={onClose} hasActiveFilter={hasActiveFilter} />)

  it('renders modal with message and disabled export button', () => {
    renderComponent()

    expect(
      screen.getByText('The CSV includes transactions from the selected period, suitable for reporting.'),
    ).toBeTruthy()
    expect(screen.queryByText("Transaction history filters won't apply here.")).not.toBeTruthy()
    expect(screen.getByLabelText('Date range')).toBeTruthy()

    const exportBtn = screen.getByRole('button', { name: 'Export' })
    expect(exportBtn).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeTruthy()
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
    render(<CsvTxExportModal onClose={onClose} />)

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

    expect(screen.getByText("Transaction history filter won't apply here.")).toBeInTheDocument()
  })
})
