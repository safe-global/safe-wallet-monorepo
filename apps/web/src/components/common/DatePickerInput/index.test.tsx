import type { ReactNode } from 'react'
import { format, isValid } from 'date-fns'
import { FormProvider, useForm, useFormState, useWatch } from 'react-hook-form'
import { render, screen, waitFor } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import DatePickerInput, { _fromText, _toMaskedText } from './index'

type FormValues = { date: Date | null }

const describeValue = (value: Date | null | undefined) => {
  if (value === null || value === undefined) return 'empty'
  return isValid(value) ? format(value, 'yyyy-MM-dd') : 'invalid'
}

const FormProbe = () => {
  const value = useWatch<FormValues, 'date'>({ name: 'date' })
  const { isValid: isFormValid } = useFormState<FormValues>()
  return (
    <>
      <output data-testid="value">{describeValue(value)}</output>
      <output data-testid="form-valid">{String(isFormValid)}</output>
    </>
  )
}

const Wrapper = ({ children, defaultValue = null }: { children: ReactNode; defaultValue?: Date | null }) => {
  const methods = useForm<FormValues>({ defaultValues: { date: defaultValue }, mode: 'all' })
  return (
    <FormProvider {...methods}>
      <form>
        {children}
        <FormProbe />
        <button type="button" onClick={() => methods.reset({ date: defaultValue })}>
          Clear
        </button>
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

  it('explains a seeded date that is out of range before the field is touched (WA-3231)', async () => {
    // A bookmarked transaction-history URL can carry a date the previous picker allowed but this one
    // does not. Without the mount validation the form is invalid with nothing on screen saying why.
    renderInput(new Date('1999-01-01T00:00:00'))

    expect(await screen.findByText('Date is out of range')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('form-valid')).toHaveTextContent('false'))
  })

  it('stays quiet when the seeded date is inside the range', async () => {
    renderInput(new Date('2020-03-09T00:00:00'))

    await waitFor(() => expect(screen.getByTestId('form-valid')).toHaveTextContent('true'))
    expect(screen.queryByText('Date is out of range')).not.toBeInTheDocument()
  })

  it('stays quiet on mount when there is no seeded date', async () => {
    renderInput()

    await waitFor(() => expect(screen.getByTestId('form-valid')).toHaveTextContent('true'))
    expect(screen.queryByText('Invalid date')).not.toBeInTheDocument()
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

    it('holds no real date until the entry is complete', async () => {
      renderInput()
      const input = screen.getByLabelText('Start date')

      await userEvent.type(input, '01/01/20')
      expect(screen.getByTestId('value')).toHaveTextContent('invalid')

      await userEvent.type(input, '23')
      await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('2023-01-01'))
      expect(input).toHaveValue('01/01/2023')
    })

    it('marks the form invalid while the entry is unfinished, so it cannot be submitted', async () => {
      renderInput()

      await waitFor(() => expect(screen.getByTestId('form-valid')).toHaveTextContent('true'))

      await userEvent.type(screen.getByLabelText('Start date'), '01/01')
      await waitFor(() => expect(screen.getByTestId('form-valid')).toHaveTextContent('false'))

      await userEvent.type(screen.getByLabelText('Start date'), '/2023')
      await waitFor(() => expect(screen.getByTestId('form-valid')).toHaveTextContent('true'))
    })

    it('does not nag about an unfinished entry until the field is left', async () => {
      renderInput()
      const input = screen.getByLabelText('Start date')

      await userEvent.type(input, '30')
      expect(screen.queryByText('Invalid date')).not.toBeInTheDocument()

      await userEvent.tab()
      expect(await screen.findByText('Invalid date')).toBeInTheDocument()
    })

    it('opens the calendar on the first click even with an unfinished entry (WA-3231)', async () => {
      renderInput()

      await userEvent.type(screen.getByLabelText('Start date'), '01/01')
      await userEvent.click(screen.getByRole('button', { name: /start date/i }))

      expect(await screen.findByRole('grid')).toBeInTheDocument()
    })

    it('reports a complete but impossible date', async () => {
      renderInput()
      const input = screen.getByLabelText('Start date')

      await userEvent.type(input, '32/13/2023')

      expect(await screen.findByText('Invalid date')).toBeInTheDocument()
      expect(screen.getByTestId('value')).toHaveTextContent('invalid')
    })

    it('rejects a year the calendar cannot reach', async () => {
      renderInput()

      // The mask allows a 4-digit year, so this is a complete, real, but absurd date. The MUI picker
      // this replaced clamped to 1900-2099.
      await userEvent.type(screen.getByLabelText('Start date'), '01/01/0002')

      expect(await screen.findByText('Date is out of range')).toBeInTheDocument()
      await waitFor(() => expect(screen.getByTestId('form-valid')).toHaveTextContent('false'))
    })

    it('accepts a date inside the selectable range', async () => {
      renderInput()

      await userEvent.type(screen.getByLabelText('Start date'), '09/03/2020')

      await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('2020-03-09'))
      expect(screen.queryByText('Date is out of range')).not.toBeInTheDocument()
      expect(screen.queryByText('Invalid date')).not.toBeInTheDocument()
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
      await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('empty'))
      expect(screen.queryByText('Invalid date')).not.toBeInTheDocument()
    })

    it('clears an unfinished entry and its error when the form is reset', async () => {
      renderInput()
      const input = screen.getByLabelText('Start date')

      await userEvent.type(input, '01/01')
      await userEvent.tab()
      expect(await screen.findByText('Invalid date')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Clear' }))

      await waitFor(() => expect(input).toHaveValue(''))
      await waitFor(() => expect(screen.queryByText('Invalid date')).not.toBeInTheDocument())
      expect(screen.getByTestId('value')).toHaveTextContent('empty')
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

    it('offers bounded month and year dropdowns', async () => {
      renderInput(new Date('2026-03-09T00:00:00'))

      await userEvent.click(screen.getByRole('button', { name: /start date/i }))
      await screen.findByRole('grid')

      const [months, years] = screen.getAllByRole('combobox')
      expect(months.querySelectorAll('option')).toHaveLength(12)
      // 20 years back plus the current one, capped at today because the field disables the future
      expect(years.querySelectorAll('option')).toHaveLength(21)
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
  it('returns an invalid date for an incomplete entry instead of a bogus year', () => {
    expect(isValid(_fromText('01/01/2'))).toBe(false)
    expect(isValid(_fromText('01/01/203'))).toBe(false)
  })

  it('returns an invalid date for an impossible date', () => {
    expect(isValid(_fromText('31/02/2023'))).toBe(false)
    expect(isValid(_fromText('32/13/2023'))).toBe(false)
  })

  it('returns null for an empty entry', () => {
    expect(_fromText('')).toBeNull()
  })

  it('parses a complete entry', () => {
    expect(_fromText('09/03/2026')).toEqual(new Date(2026, 2, 9))
  })
})
