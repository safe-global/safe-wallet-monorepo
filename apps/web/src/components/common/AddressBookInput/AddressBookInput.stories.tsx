import type { Meta, StoryObj } from '@storybook/react'
import { Box } from '@mui/material'
import { FormProvider, useForm } from 'react-hook-form'
import { createMockStory } from '@/stories/mocks'
import AddressBookInput from '.'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  store: {
    addressBook: {
      '1': {
        '0x1234567890123456789012345678901234567890': 'Alice',
        '0x2345678901234567890123456789012345678901': 'Bob',
      },
    },
  },
})

const AddressBookInputStory = ({ canAdd = false }: { canAdd?: boolean }) => {
  const methods = useForm({
    defaultValues: {
      recipient: '',
    },
    mode: 'onChange',
  })

  return (
    <FormProvider {...methods}>
      <Box sx={{ width: 360 }}>
        <AddressBookInput name="recipient" label="Recipient address" canAdd={canAdd} />
      </Box>
    </FormProvider>
  )
}

const meta = {
  title: 'Components/Common/AddressBookInput',
  component: AddressBookInputStory,
  decorators: [defaultSetup.decorator],
  parameters: {
    layout: 'centered',
    ...defaultSetup.parameters,
  },
} satisfies Meta<typeof AddressBookInputStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const CanAddUnknownAddress: Story = {
  args: {
    canAdd: true,
  },
}
