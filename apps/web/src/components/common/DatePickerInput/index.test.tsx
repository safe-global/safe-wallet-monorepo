import type { ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import DatePickerInput from './index'

const Wrapper = ({ children, defaultValue = null }: { children: ReactNode; defaultValue?: Date | null }) => {
  const methods = useForm({ defaultValues: { date: defaultValue }, mode: 'all' })
  return (
    <FormProvider {...methods}>
      <form>{children}</form>
    </FormProvider>
  )
}

describe('DatePickerInput', () => {
  it('renders the label', () => {
    render(
      <Wrapper>
        <DatePickerInput name="date" label="Start date" />
      </Wrapper>,
    )
    expect(screen.getByText('Start date')).toBeInTheDocument()
  })

  it('shows the selected date formatted as dd/MM/yyyy', () => {
    render(
      <Wrapper defaultValue={new Date('2026-03-09T00:00:00')}>
        <DatePickerInput name="date" label="Start date" />
      </Wrapper>,
    )
    expect(screen.getByDisplayValue('09/03/2026')).toBeInTheDocument()
  })

  it('opens the calendar grid when the trigger is clicked', async () => {
    render(
      <Wrapper>
        <DatePickerInput name="date" label="Start date" />
      </Wrapper>,
    )
    await userEvent.click(screen.getByRole('button', { name: /start date/i }))
    expect(await screen.findByRole('grid')).toBeInTheDocument()
  })
})
