import type { Meta, StoryObj } from '@storybook/react'
import ParsingErrorBoundary from './ParsingErrorBoundary'

const Broken = (): never => {
  throw new Error('Cannot render decoded value')
}

const meta = {
  title: 'Components/Common/ParsingErrorBoundary',
  component: ParsingErrorBoundary,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ParsingErrorBoundary>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: <div>Decoded data</div>,
  },
}

export const RenderError: Story = {
  args: {
    children: <Broken />,
  },
}
