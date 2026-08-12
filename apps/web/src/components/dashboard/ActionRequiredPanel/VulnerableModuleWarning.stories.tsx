import type { Meta, StoryObj } from '@storybook/react'
import { VulnerableModuleWarning } from './VulnerableModuleWarning'

const meta = {
  title: 'Components/Dashboard/VulnerableModuleWarning',
  component: VulnerableModuleWarning,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof VulnerableModuleWarning>

export default meta
type Story = StoryObj<typeof meta>

export const Affected: Story = {
  args: {
    isVulnerable: true,
  },
}
