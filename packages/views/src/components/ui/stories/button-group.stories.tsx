import type { Meta, StoryObj } from '@storybook/react'
import { Download, FileUp } from 'lucide-react'
import { Button } from '../button'
import { ButtonGroup } from '../button-group'

const meta = {
  title: 'UI/ButtonGroup',
  component: ButtonGroup,
  argTypes: {
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
  },
  args: { 'aria-label': 'Import and export' },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline" size="lg">
        <FileUp aria-hidden="true" data-icon="inline-start" />
        Import
      </Button>
      <Button variant="outline" size="lg">
        <Download aria-hidden="true" data-icon="inline-start" />
        Export
      </Button>
    </ButtonGroup>
  ),
} satisfies Meta<typeof ButtonGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {}

export const Vertical: Story = { args: { orientation: 'vertical' } }

export const DefaultSize: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline">Day</Button>
      <Button variant="outline">Week</Button>
      <Button variant="outline">Month</Button>
    </ButtonGroup>
  ),
}
