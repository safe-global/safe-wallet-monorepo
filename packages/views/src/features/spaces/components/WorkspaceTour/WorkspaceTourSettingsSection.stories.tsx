import type { Meta, StoryObj } from '@storybook/react'
import WorkspaceTourSettingsSection from './WorkspaceTourSettingsSection'

const meta = {
  title: 'Features/Spaces/WorkspaceTour/WorkspaceTourSettingsSection',
  component: WorkspaceTourSettingsSection,
  parameters: { layout: 'padded' },
  args: { onStart: () => {} },
} satisfies Meta<typeof WorkspaceTourSettingsSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
