import type { ReactNode } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { render, screen, waitFor } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import DatePickerInput, { _fromText, _toMaskedText } from './index'

type FormValues = { date: Date | null }

const ValueProbe = () => {
  const value = useWatch<FormValues, 'date'>({ name: 'date' })
  return <output data-testid="value">{value === null || value === undefined ? 'null' : String(value)}</output>
}

const Wrapper = ({ children, defaultValue = null }: { children: ReactNode; defaultValue?: Date | null }) => {
  const methods = useForm<FormValues>({ defaultValues: { date: defaultValue }, mode: 'all' })
  return (
    <FormProvider {...methods}>
      <form>
        {children}
        <ValueProbe />
      </form>
    </FormProvider>
  )
}

const renderInput = (defaultValue?: Date | null) =>
  render(
    <Wrapper defaultValue={defaultValue}>
      <DatePickerInput name="date" label="Start date" />
    </Wrapper>,
  )

describe('DatePickerInput', () => {
  it('renders the label', () => {
    renderInput()
    expect(screen.getByText('Start date')).toBeInTheDocument()
  })

  it('shows the selected date formatted as dd/MM/yyyy', () => {
    renderInput(new Date('2026-03-09T00:00:00'))
    expect(screen.getByDisplayValue('09/03/2026')).toBeInTheDocument()
  })

  it('opens the calendar grid when the trigger is clicked', async () => {
    renderInput()
    await userEvent.click(screen.getByRole('button', { name: /start date/i }))
    expect(await screen.findByRole('grid')).toBeInTheDocument()
  })

  describe('typing', () => {
    it('inserts separators and never pads the year while typing (WA-3231)', async () => {
      renderInput()
      const input = screen.getByLabelText('Start date')

      await userEvent.type(input, '0')
      expect(input).toHaveValue('0')
      await userEvent.type(input, '1')
      expect(input).toHaveValue('01')
      await userEvent.type(input, '0')
      expect(input).toHaveValue('01/0')
      await userEvent.type(input, '1')
      expect(input).toHaveValue('01/01')
      await userEvent.type(input, '2')
      expect(input).toHaveValue('01/01/2')
      await userEvent.type(input, '0')
      expect(input).toHaveValue('01/01/20')
      await userEvent.type(input, '3')
      expect(input).toHaveValue('01/01/203')
      await userEvent.type(input, '6')
      expect(input).toHaveValue('01/01/2036')
    })

    it('ignores typed separators and extra digits', async () => {
      renderInput()
      const input = screen.getByLabelText('Start date')

      await userEvent.type(input, '01/01/2036999')

      expect(input).toHaveValue('01/01/2036')
    })

    it('keeps the form value empty until the entry is complete', async () => {
      renderInput()
      const input = screen.getByLabelText('Start date')

      await userEvent.type(input, '01/01/20')
      expect(screen.getByTestId('value')).toHaveTextContent('null')

      await userEvent.type(input, '23')
      await waitFor(() => expect(screen.getByTestId('value')).not.toHaveTextContent('null'))
      expect(input).toHaveValue('01/01/2023')
    })

    it('reports an unfinished entry only once the field is left', async () => {
      renderInput()
      const input = screen.getByLabelText('Start date')

      await userEvent.type(input, '01/01')
      expect(screen.queryByText('Invalid date')).not.toBeInTheDocument()

      await userEvent.tab()
      expect(await screen.findByText('Invalid date')).toBeInTheDocument()
    })

    it('reports a complete but impossible date', async () => {
      renderInput()
      const input = screen.getByLabelText('Start date')

      await userEvent.type(input, '32/13/2023')
      await userEvent.tab()

      expect(await screen.findByText('Invalid date')).toBeInTheDocument()
      expect(screen.getByTestId('value')).toHaveTextContent('null')
    })

    it('rejects a future date', async () => {
      renderInput()

      await userEvent.type(screen.getByLabelText('Start date'), '01/01/2100')

      expect(await screen.findByText('Date cannot be in the future')).toBeInTheDocument()
    })

    it('clears the form value when the entry is deleted', async () => {
      renderInput(new Date('2026-03-09T00:00:00'))
      const input = screen.getByLabelText('Start date')

      await userEvent.clear(input)

      expect(input).toHaveValue('')
      await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('null'))
      expect(screen.queryByText('Invalid date')).not.toBeInTheDocument()
    })
  })

  describe('calendar', () => {
    it('fills the input and closes the calendar on selection', async () => {
      renderInput(new Date('2026-03-09T00:00:00'))

      await userEvent.click(screen.getByRole('button', { name: /start date/i }))
      const cell = await screen.findByRole('gridcell', { name: '11' })
      await userEvent.click(cell.querySelector('button') ?? cell)

      expect(screen.getByLabelText('Start date')).toHaveValue('11/03/2026')
      await waitFor(() => expect(screen.queryByRole('grid')).not.toBeInTheDocument())
    })

    it('opens without crashing when the form holds an invalid date (WA-3231)', async () => {
      renderInput(new Date('not-a-date'))

      await userEvent.click(screen.getByRole('button', { name: /start date/i }))

      expect(await screen.findByRole('grid')).toBeInTheDocument()
    })
  })
})

describe('_toMaskedText', () => {
  it.each([
    ['', ''],
    ['0', '0'],
    ['01', '01'],
    ['011', '01/1'],
    ['01/01/2', '01/01/2'],
    ['01/01/2036', '01/01/2036'],
    ['01/01/0002036', '01/01/0002'],
    ['ab01cd01ef2036', '01/01/2036'],
    ['1/1/2036', '01/01/2036'],
    ['9/12/2026', '09/12/2026'],
  ])('masks %p as %p', (raw, expected) => {
    expect(_toMaskedText(raw)).toBe(expected)
  })
})

describe('_fromText', () => {
  it('returns null for an incomplete entry instead of a bogus year', () => {
    expect(_fromText('01/01/2')).toBeNull()
    expect(_fromText('01/01/203')).toBeNull()
  })

  it('returns null for an impossible date', () => {
    expect(_fromText('31/02/2023')).toBeNull()
    expect(_fromText('32/13/2023')).toBeNull()
  })

  it('parses a complete entry', () => {
    expect(_fromText('09/03/2026')).toEqual(new Date(2026, 2, 9))
  })
})
