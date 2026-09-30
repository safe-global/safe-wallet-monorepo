import type { Meta, StoryObj } from '@storybook/react'
import { useForm, FormProvider } from 'react-hook-form'
import DatePickerInput from './index'

const FormWrapper = ({
  children,
  defaultValues = {},
}: {
  children: React.ReactNode
  defaultValues?: Record<string, Date | null>
}) => {
  const methods = useForm({ defaultValues, mode: 'all' })
  return <FormProvider {...methods}>{children}</FormProvider>
}

/**
 * The shared date field: a masked `dd/MM/yyyy` text entry plus a calendar popover. Used by the
 * transaction-history filter and the CSV export modal.
 *
 * The entry is masked to a well-formed prefix of `dd/MM/yyyy` — digits are kept, separators are
 * inserted, and the year stops at four digits — so a half-typed date is never reformatted under the
 * cursor. A date reaches the form only once the entry is complete and real; anything else leaves the
 * value empty and reports "Invalid date" once the field is left.
 */
const meta: Meta<typeof DatePickerInput> = {
  title: 'Components/Common/DatePickerInput',
  component: DatePickerInput,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <FormWrapper>
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    name: 'birthDate',
    label: 'Birth date',
  },
}

export const WithValue: Story = {
  args: {
    name: 'executionDate',
    label: 'From',
  },
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <FormWrapper defaultValues={{ executionDate: new Date(2026, 0, 15) }}>
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
}

/** An unfinished or impossible entry keeps the form value empty and reports itself once left. */
export const InvalidEntry: Story = {
  args: {
    name: 'brokenDate',
    label: 'From',
  },
  play: async ({ canvasElement }) => {
    const { userEvent, within } = await import('storybook/test')
    await userEvent.type(within(canvasElement).getByLabelText('From'), '32/13/2026')
    await userEvent.tab()
  },
}

export const CalendarOpen: Story = {
  args: {
    name: 'pickedDate',
    label: 'From',
  },
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <FormWrapper defaultValues={{ pickedDate: new Date(2026, 0, 15) }}>
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const { userEvent, within } = await import('storybook/test')
    await userEvent.click(within(canvasElement).getByRole('button', { name: /calendar/i }))
  },
}

/**
 * A date seeded from outside the input, for example from a bookmarked filter URL, that falls outside
 * the selectable range. The field says so on mount rather than leaving the form quietly unsubmittable.
 */
export const SeededOutOfRange: Story = {
  args: {
    name: 'staleDate',
    label: 'From',
  },
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <FormWrapper defaultValues={{ staleDate: new Date(1999, 0, 1) }}>
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
}

export const AllowFutureDates: Story = {
  args: {
    name: 'expiryDate',
    label: 'Expiry date',
    disableFuture: false,
  },
}

export const DisableFutureDates: Story = {
  args: {
    name: 'createdDate',
    label: 'Created date',
    disableFuture: true,
  },
}
