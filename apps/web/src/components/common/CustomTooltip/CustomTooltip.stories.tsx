import type { Meta, StoryObj } from '@storybook/react'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { CustomTooltip } from './index'

const meta = {
  component: CustomTooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CustomTooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'This is a tooltip',
    children: <Button variant="outline">Hover me</Button>,
  },
}

export const WithIcon: Story = {
  args: {
    title: 'More information about this feature',
    children: (
      <Button variant="ghost" size="icon-sm">
        <Info />
      </Button>
    ),
  },
}

export const TopPlacement: Story = {
  args: {
    title: 'Tooltip on top',
    children: <Button variant="outline">Top placement</Button>,
  },
}

export const BottomPlacement: Story = {
  args: {
    title: 'Tooltip on bottom',
    children: <Button variant="outline">Bottom placement</Button>,
  },
}

export const LeftPlacement: Story = {
  args: {
    title: 'Tooltip on left',
    children: <Button variant="outline">Left placement</Button>,
  },
}

export const RightPlacement: Story = {
  args: {
    title: 'Tooltip on right',
    children: <Button variant="outline">Right placement</Button>,
  },
}

export const LongContent: Story = {
  args: {
    title:
      'This is a much longer tooltip that contains more detailed information about a particular feature or functionality.',
    children: <Button variant="outline">Long tooltip</Button>,
  },
}

export const WithComplexContent: Story = {
  args: {
    title: (
      <div>
        <Typography variant="paragraph-bold">Important notice</Typography>
        <Typography variant="paragraph-small">This action cannot be undone.</Typography>
      </div>
    ),
    children: <Button variant="destructive">Delete</Button>,
  },
}
