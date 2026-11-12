import React from 'react'
import { screen, fireEvent, within } from '@testing-library/react'
import { act, fakerChecksummedAddress, render } from '@/tests/test-utils'
import '@testing-library/jest-dom'
import TxFilterForm from './index'
import { TxFilterType } from '@/utils/tx-history-filter'
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

  it('renders all transaction type options', () => {
    renderComponent()

    Object.values(TxFilterType).forEach((type) => {
      expect(screen.getByRole('radio', { name: type })).toBeInTheDocument()
    })
  })

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

    expect(await screen.findByText(errorMsgEndDate)).toBeInTheDocument()

    await act(async () => {
      fireEvent.change(fromDateInput, { target: { value: '' } })
      fireEvent.change(toDateInput, { target: { value: '' } })
      fireEvent.change(toDateInput, { target: { value: toDate } })
      fireEvent.change(fromDateInput, { target: { value: fromDate } })
    })

    expect(toDateInput).toHaveValue(toDate)
    expect(fromDateInput).toHaveValue(fromDate)

    expect(await screen.findByText(errorMsgStartDate)).toBeInTheDocument()
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

    expect(await screen.findByText(errorMsgFutureDate)).toBeInTheDocument()

    await act(async () => {
      fireEvent.change(fromDateInput, { target: { value: futureDate } })
      fireEvent.change(toDateInput, { target: { value: toDate } })
    })

    expect(await screen.findByText(errorMsgFutureDate)).toBeInTheDocument()
  })

  it('Verify that when entering invalid characters in token filed shows an error message', async () => {
    renderComponent()

    const token = '694urt5'

    // AddressInput puts the testid on its wrapper box; the typable input is inside
    const tokenInput = within(screen.getByTestId('token-input')).getByRole<HTMLInputElement>('textbox')

    expect(tokenInput).toBeInTheDocument()

    await act(async () => {
      fireEvent.change(tokenInput, { target: { value: token } })
    })

    expect(await screen.findByText(errorMsgFormat, { selector: 'label' })).toBeInTheDocument()
  })

  it('Verify there is error when 0 is entered in amount field', async () => {
    renderComponent()

    const errorMsgZero = 'The value must be greater than 0'
    const amountInput = screen.getByTestId('amount-input') as HTMLInputElement

    expect(amountInput).toBeInTheDocument()

    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '0' } })
    })

    expect(await screen.findByText(errorMsgZero, { selector: 'label' })).toBeInTheDocument()
  })

  it('Verify that entering negative numbers and a non-numeric value in the amount filter is not allowed', async () => {
    renderComponent()

    const amountInput = screen.getByTestId('amount-input') as HTMLInputElement

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

    const outgoingRadio = screen.getByRole('radio', { name: 'Outgoing' })
    fireEvent.click(outgoingRadio)

    const nonceInput = screen.getByTestId('nonce-input') as HTMLInputElement

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

    const outgoingRadio = screen.getByRole('radio', { name: 'Module-based' })
    fireEvent.click(outgoingRadio)

    const addressInput = screen.getByLabelText('Module') as HTMLInputElement

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

  describe('match recipient by', () => {
    const RECIPIENT = '0x23cbCbbC748c961E570Cfc05Ff65554ECB8955E9'
    const selectOutgoing = () => fireEvent.click(screen.getByRole('radio', { name: 'Outgoing' }))
    const paidOption = () => screen.getByRole('radio', { name: 'Who was paid' })
    const calledOption = () => screen.getByRole('radio', { name: 'Address called' })
    const lastPushedQuery = () => mockRouter.push.mock.calls.at(-1)[0].query
    const typeRecipient = async (recipient = RECIPIENT) => {
      await act(async () => {
        fireEvent.change(screen.getByLabelText('Recipient'), { target: { value: recipient } })
      })
    }
    const typeToken = async (token: string) => {
      await act(async () => {
        fireEvent.change(within(screen.getByTestId('token-input')).getByRole('textbox'), { target: { value: token } })
      })
    }
    const apply = async () => {
      await act(async () => {
        fireEvent.click(screen.getByTestId('apply-btn'))
      })
    }

    beforeEach(() => {
      mockRouter.push.mockClear()
    })

    it('is not offered for the incoming filter', () => {
      renderComponent()

      expect(screen.queryByRole('radio', { name: 'Who was paid' })).not.toBeInTheDocument()
    })

    it('is not offered on outgoing until a recipient is entered', () => {
      renderComponent()

      selectOutgoing()

      expect(screen.queryByRole('radio', { name: 'Who was paid' })).not.toBeInTheDocument()
      expect(screen.getByTestId('amount-input')).toBeInTheDocument()
      expect(screen.getByTestId('nonce-input')).toBeInTheDocument()
      expect(screen.queryByLabelText('Token address')).not.toBeInTheDocument()
    })

    it('matches who was paid once a recipient is entered', async () => {
      renderComponent()
      selectOutgoing()

      await typeRecipient()

      expect(paidOption()).toBeChecked()
      expect(screen.queryByTestId('amount-input')).not.toBeInTheDocument()
      expect(screen.queryByTestId('nonce-input')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Token address')).toBeInTheDocument()
    })

    it('keeps the address called search when a nonce was entered first', async () => {
      renderComponent()
      selectOutgoing()
      await act(async () => {
        fireEvent.change(screen.getByTestId('nonce-input'), { target: { value: '64' } })
      })

      await typeRecipient()

      expect(calledOption()).toBeChecked()
      expect(screen.getByTestId('nonce-input')).toHaveValue('64')
    })

    it('keeps the address called search when an amount was entered first', async () => {
      renderComponent()
      selectOutgoing()
      await act(async () => {
        fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '1' } })
      })

      await typeRecipient()

      expect(calledOption()).toBeChecked()
      expect(screen.getByTestId('amount-input')).toHaveValue('1')
    })

    it('offers amount and nonce again, without the match options, once the recipient is cleared', async () => {
      renderComponent()
      selectOutgoing()
      await typeRecipient()

      await typeRecipient('')

      expect(screen.queryByRole('radio', { name: 'Who was paid' })).not.toBeInTheDocument()
      expect(screen.getByTestId('amount-input')).toBeInTheDocument()
      expect(screen.getByTestId('nonce-input')).toBeInTheDocument()
    })

    it('puts the token address in the URL when applied with who was paid', async () => {
      const token = fakerChecksummedAddress()
      renderComponent()
      selectOutgoing()
      await typeRecipient()
      await typeToken(token)

      await apply()

      expect(lastPushedQuery()).toMatchObject({ to: RECIPIENT, transfers: 'true', token_address: token })
    })

    it('leaves the token address out of the URL when switched to address called', async () => {
      renderComponent()
      selectOutgoing()
      await typeRecipient()
      await typeToken(fakerChecksummedAddress())
      await act(async () => {
        fireEvent.click(calledOption())
      })

      await apply()

      expect(lastPushedQuery()).toMatchObject({ type: 'Outgoing', to: RECIPIENT })
      expect(lastPushedQuery()).not.toHaveProperty('token_address')
    })

    it('puts the transfers flag in the URL when applied with who was paid', async () => {
      renderComponent()
      selectOutgoing()
      await typeRecipient()

      await act(async () => {
        fireEvent.click(screen.getByTestId('apply-btn'))
      })

      expect(lastPushedQuery()).toMatchObject({ type: 'Outgoing', to: RECIPIENT, transfers: 'true' })
    })

    it('leaves the transfers flag out of the URL when applied with address called', async () => {
      renderComponent()
      selectOutgoing()
      await typeRecipient()
      await act(async () => {
        fireEvent.click(calledOption())
      })

      await act(async () => {
        fireEvent.click(screen.getByTestId('apply-btn'))
      })

      expect(lastPushedQuery()).toMatchObject({ type: 'Outgoing', to: RECIPIENT })
      expect(lastPushedQuery()).not.toHaveProperty('transfers')
    })

    it('starts on who was paid when the URL has the transfers flag', () => {
      ;(useRouter as jest.Mock).mockReturnValue({
        ...mockRouter,
        query: { type: 'Outgoing', to: RECIPIENT, transfers: 'true' },
      })

      renderComponent()

      expect(paidOption()).toBeChecked()
    })

    it('starts on address called for a link without the transfers flag', () => {
      ;(useRouter as jest.Mock).mockReturnValue({ ...mockRouter, query: { type: 'Outgoing', to: RECIPIENT } })

      renderComponent()

      expect(calledOption()).toBeChecked()
    })
  })
})
