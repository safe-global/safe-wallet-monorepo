import type { Meta, StoryObj } from '@storybook/react'
import { useForm } from 'react-hook-form'
import { createMockStory } from '@/stories/mocks'
import AddMemberInput from './AddMemberInput'

type FormValues = {
  inviteeIdentifier: string
}

const addressBook = {
  '0x1234567890123456789012345678901234567890': 'Alice',
  '0x2345678901234567890123456789012345678901': 'Bob',
  '0x3456789012345678901234567890123456789012': 'Charlie',
}

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true },
  shadcn: true,
  store: {
    addressBook: {
      '1': addressBook,
    },
  },
})

const AddMemberInputStory = ({ error }: { error?: string }) => {
  const { register, setValue, watch } = useForm<FormValues>({
    defaultValues: { inviteeIdentifier: '' },
  })

  return (
    <div className="w-[360px] min-h-[50vh] pt-[22vh]">
      <AddMemberInput
        error={error}
        inputProps={register('inviteeIdentifier')}
        onSelectAddress={(address) => setValue('inviteeIdentifier', address)}
        value={watch('inviteeIdentifier')}
      />
    </div>
  )
}

const meta = {
  title: 'Features/Spaces/AddMemberInput',
  component: AddMemberInputStory,
  decorators: [defaultSetup.decorator],
  parameters: {
    layout: 'centered',
    ...defaultSetup.parameters,
  },
} satisfies Meta<typeof AddMemberInputStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithError: Story = {
  args: {
    error: 'Enter a valid email, wallet address, or ENS.',
  },
}
