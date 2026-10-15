import type { Meta, StoryObj } from '@storybook/react'
import { useArgs } from 'storybook/preview-api'
import { fn, userEvent, within } from 'storybook/test'
import ExperimentalSection from './ExperimentalSection'

const meta = {
  title: 'Features/Spaces/SpaceSettings/ExperimentalSection',
  component: ExperimentalSection,
  parameters: {
    layout: 'padded',
  },
  args: {
    isRecipientAllowlistEnabled: false,
    onRecipientAllowlistChange: fn(),
    isAdmin: true,
    isSaving: false,
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs()

    const handleChange = (enabled: boolean) => {
      updateArgs({ isRecipientAllowlistEnabled: enabled })
      args.onRecipientAllowlistChange(enabled)
    }

    return (
      <div className="max-w-[720px]">
        <ExperimentalSection {...args} onRecipientAllowlistChange={handleChange} />
      </div>
    )
  },
} satisfies Meta<typeof ExperimentalSection>

export default meta
type Story = StoryObj<typeof meta>

export const RecipientAllowlistOff: Story = {}

export const RecipientAllowlistOn: Story = {
  args: {
    isRecipientAllowlistEnabled: true,
  },
}

export const Saving: Story = {
  args: {
    isRecipientAllowlistEnabled: true,
    isSaving: true,
  },
}

export const NonAdmin: Story = {
  tags: ['skip-visual-test'],
  args: {
    isRecipientAllowlistEnabled: true,
    isAdmin: false,
  },
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByTestId('recipient-allowlist-toggle')
    await userEvent.hover(toggle)
  },
}
