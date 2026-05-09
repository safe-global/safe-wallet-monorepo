import React from 'react'
import { screen, fireEvent } from '@testing-library/react'
import { act, render } from '@/tests/test-utils'
import '@testing-library/jest-dom'
import TxFilterForm from './index'
import { useRouter } from 'next/router'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

const mockRouter = {
  query: {},
  pathname: '',
  push: jest.fn(),
}

const onClose = jest.fn()

const fromDate = '20/01/2021'
const toDate = '20/01/2020'
const placeholder = 'DD/MM/YYYY'
const errorMsgFormat = 'Invalid address format'

describe('TxFilterForm Component Tests', () => {
  beforeEach(() => {
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  const renderComponent = () => render(<TxFilterForm onClose={onClose} />)

  it('Verify that when an end date is behind a start date, there are validation rules applied', async () => {
    renderComponent()

    const errorMsgEndDate = 'Must be after "From" date'
    const errorMsgStartDate = 'Must be before "To" date'

    const fromDateInput = screen.getAllByPlaceholderText(placeholder)[0]
    const toDateInput = screen.getAllByPlaceholderText(placeholder)[1]

    await act(async () => {
      fireEvent.change(fromDateInput, { target: { value: fromDate } })
      fireEvent.change(toDateInput, { target: { value: toDate } })
    })

    expect(fromDateInput).toHaveValue(fromDate)
    expect(toDateInput).toHaveValue(toDate)

    expect(await screen.findByText(errorMsgEndDate, { selector: 'label' })).toBeInTheDocument()

    await act(async () => {
      fireEvent.change(fromDateInput, { target: { value: '' } })
      fireEvent.change(toDateInput, { target: { value: '' } })
      fireEvent.change(toDateInput, { target: { value: toDate } })
      fireEvent.change(fromDateInput, { target: { value: fromDate } })
    })

    expect(toDateInput).toHaveValue(toDate)
    expect(fromDateInput).toHaveValue(fromDate)

    expect(await screen.findByText(errorMsgStartDate, { selector: 'label' })).toBeInTheDocument()
  })

  it('Verify there is error when start and end date contain far future dates', async () => {
    renderComponent()

    const futureDate = '20/01/2036'
    const errorMsgFutureDate = 'Date cannot be in the future'

    const fromDateInput = screen.getAllByPlaceholderText(placeholder)[0]
    const toDateInput = screen.getAllByPlaceholderText(placeholder)[1]

    await act(async () => {
      fireEvent.change(fromDateInput, { target: { value: fromDate } })
      fireEvent.change(toDateInput, { target: { value: futureDate } })
    })

    expect(await screen.findByText(errorMsgFutureDate, { selector: 'label' })).toBeInTheDocument()

    await act(async () => {
      fireEvent.change(fromDateInput, { target: { value: futureDate } })
      fireEvent.change(toDateInput, { target: { value: toDate } })
    })

    expect(await screen.findByText(errorMsgFutureDate, { selector: 'label' })).toBeInTheDocument()
  })

  it('Verify that when entering invalid characters in token filed shows an error message', async () => {
    renderComponent()

    const token = '694urt5'

    const tokenInput = screen.getByTestId('token-input').querySelector('input') as HTMLInputElement

    expect(tokenInput).toBeInTheDocument()

    await act(async () => {
      fireEvent.change(tokenInput, { target: { value: token } })
    })

    expect(await screen.findByText(errorMsgFormat, { selector: 'label' })).toBeInTheDocument()
  })

  it('Verify there is error when 0 is entered in amount field', async () => {
    renderComponent()

    const errorMsgZero = 'The value must be greater than 0'
    const amountInput = screen.getByTestId('amount-input').querySelector('input') as HTMLInputElement

    expect(amountInput).toBeInTheDocument()

    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '0' } })
    })

    expect(await screen.findByText(errorMsgZero, { selector: 'label' })).toBeInTheDocument()
  })

  it('Verify that entering negative numbers and a non-numeric value in the amount filter is not allowed', async () => {
    renderComponent()

    const amountInput = screen.getByTestId('amount-input').querySelector('input') as HTMLInputElement

    expect(amountInput).toBeInTheDocument()

    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '-1' } })
    })
    expect(amountInput).toHaveValue('1')
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: 'hrtyu' } })
    })
    expect(amountInput).toHaveValue('')
  })

  it('Verify that characters and negative numbers cannot be entered in nonce filed', async () => {
    renderComponent()

    const outgoingRadio = screen.getByLabelText('Outgoing')
    fireEvent.click(outgoingRadio)

    const nonceInput = screen.getByTestId('nonce-input').querySelector('input') as HTMLInputElement

    expect(nonceInput).toBeInTheDocument()

    await act(async () => {
      fireEvent.change(nonceInput, { target: { value: '-1' } })
    })
    expect(nonceInput).toHaveValue('1')
    await act(async () => {
      fireEvent.change(nonceInput, { target: { value: 'hrtyu' } })
    })
    expect(nonceInput).toHaveValue('')
  })

  it('Verify that entering random characters in module field shows error', async () => {
    renderComponent()

    const outgoingRadio = screen.getByLabelText('Module-based')
    fireEvent.click(outgoingRadio)

    const addressInput = screen.getByTestId('address-item').querySelector('input') as HTMLInputElement

    expect(addressInput).toBeInTheDocument()

    await act(async () => {
      fireEvent.change(addressInput, { target: { value: 'hrtyu' } })
    })
    expect(await screen.findByText(errorMsgFormat, { selector: 'label' })).toBeInTheDocument()
  })

  it('Verify when filter is cleared, the filter modal is still displayed', async () => {
    renderComponent()

    const fromDate1 = '20/01/2021'
    const toDate1 = '20/01/2022'

    const clearButton = screen.getByTestId('clear-btn')
    const modal = screen.getByTestId('filter-modal')

    const fromDateInput = screen.getAllByPlaceholderText(placeholder)[0]
    const toDateInput = screen.getAllByPlaceholderText(placeholder)[1]

    await act(async () => {
      fireEvent.change(fromDateInput, { target: { value: fromDate1 } })
      fireEvent.change(toDateInput, { target: { value: toDate1 } })
    })

    expect(fromDateInput).toHaveValue(fromDate1)
    expect(toDateInput).toHaveValue(toDate1)

    await act(async () => {
      fireEvent.click(clearButton)
    })

    expect(fromDateInput).toHaveValue('')
    expect(toDateInput).toHaveValue('')
    expect(modal).toBeInTheDocument()
  })

  it('Verify when filter is applied, it disappears from the view', async () => {
    renderComponent()

    const fromDate = '20/01/2020'
    const toDate = '20/01/2021'

    const applyButton = screen.getByTestId('apply-btn')

    const fromDateInput = screen.getAllByPlaceholderText(placeholder)[0]
    const toDateInput = screen.getAllByPlaceholderText(placeholder)[1]

    await act(async () => {
      fireEvent.change(fromDateInput, { target: { value: fromDate } })
      fireEvent.change(toDateInput, { target: { value: toDate } })
    })

    expect(fromDateInput).toHaveValue(fromDate)
    expect(toDateInput).toHaveValue(toDate)

    await act(async () => {
      fireEvent.click(applyButton)
    })

    // Check that onClose callback has been called
    expect(onClose).toHaveBeenCalled()
  })
})
