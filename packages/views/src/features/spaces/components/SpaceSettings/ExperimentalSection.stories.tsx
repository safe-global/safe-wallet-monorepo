import type { Meta, StoryObj } from '@storybook/react'
import { useArgs } from 'storybook/preview-api'
import { fn, userEvent, within } from 'storybook/test'
import ExperimentalSection, { type ExperimentalFeature } from './ExperimentalSection'

const meta = {
  title: 'Features/Spaces/SpaceSettings/ExperimentalSection',
  component: ExperimentalSection,
  parameters: {
    layout: 'padded',
  },
  args: {
    enabled: [],
    onChange: fn(),
    isAdmin: true,
    isSaving: false,
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs()

    const handleChange = (enabled: ExperimentalFeature[]) => {
      updateArgs({ enabled })
      args.onChange(enabled)
    }

    return (
      <div className="max-w-[720px]">
        <ExperimentalSection {...args} onChange={handleChange} />
      </div>
    )
  },
} satisfies Meta<typeof ExperimentalSection>

export default meta
type Story = StoryObj<typeof meta>

export const RecipientAllowlistOff: Story = {}

export const RecipientAllowlistOn: Story = {
  args: {
    enabled: ['POLICY_RECIPIENT_ALLOWLIST'],
  },
}

export const Saving: Story = {
  args: {
    enabled: ['POLICY_RECIPIENT_ALLOWLIST'],
    isSaving: true,
  },
}

export const NonAdmin: Story = {
  tags: ['skip-visual-test'],
  args: {
    enabled: ['POLICY_RECIPIENT_ALLOWLIST'],
    isAdmin: false,
  },
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByTestId('experimental-POLICY_RECIPIENT_ALLOWLIST-toggle')
    await userEvent.hover(toggle)
  },
}
