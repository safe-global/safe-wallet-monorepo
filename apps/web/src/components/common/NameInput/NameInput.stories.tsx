import type { Meta, StoryObj } from '@storybook/react'
import { Box } from '@mui/material'
import { useForm, FormProvider } from 'react-hook-form'
import NameInput from './index'

const FormWrapper = ({
  children,
  defaultValues = {},
}: {
  children: React.ReactNode
  defaultValues?: Record<string, string>
}) => {
  const methods = useForm({ defaultValues, mode: 'onChange' })
  return <FormProvider {...methods}>{children}</FormProvider>
}

const meta: Meta<typeof NameInput> = {
  component: NameInput,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <Box sx={{ width: 300 }}>
        <FormWrapper>
          <Story />
        </FormWrapper>
      </Box>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    name: 'ownerName',
    label: 'Owner name',
  },
}

export const WithPlaceholder: Story = {
  args: {
    name: 'ownerName',
    label: 'Owner name',
    placeholder: 'Enter owner name',
  },
}

export const Required: Story = {
  args: {
    name: 'ownerName',
    label: 'Owner name',
    required: true,
  },
}

export const Disabled: Story = {
  args: {
    name: 'ownerName',
    label: 'Owner name',
    disabled: true,
  },
}
