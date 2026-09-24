import type { Meta, StoryObj } from '@storybook/react'
import { Typography } from '@/components/ui/typography'
import { ProHighlight, highlightSafePro } from './index'

const meta = {
  title: 'Components/Common/ProHighlight',
  component: ProHighlight,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ProHighlight>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: 'Safe Pro' },
}

export const InSentence: Story = {
  args: { children: 'Safe Pro' },
  render: () => (
    <Typography variant="h3">{highlightSafePro('Workspaces run on Safe Pro, and Safe Pro only')}</Typography>
  ),
}
