import type { Meta, StoryObj } from '@storybook/react'
import { useForm, FormProvider } from 'react-hook-form'
import DatePickerInput from './index'

const FormWrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({ mode: 'onChange' })
  return <FormProvider {...methods}>{children}</FormProvider>
}

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
