import type { ReactElement } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Typography } from '@safe-global/views/components/ui/typography'
import { FitText } from '.'

const meta = {
  title: 'Components/Common/FitText',
  component: FitText,
  parameters: {
    layout: 'padded',
  },
  args: {
    children: '$1,278,243,618.88',
    maxFontSize: 30,
    minFontSize: 18,
  },
  render: (args) => (
    <Typography variant="h2" className="font-bold leading-[1] tracking-tight">
      <FitText {...args} />
    </Typography>
  ),
} satisfies Meta<typeof FitText>

export default meta
type Story = StoryObj<typeof meta>

const widthDecorator = (width: string) => {
  const WidthDecorator = (Story: () => ReactElement) => (
    <div className="border border-dashed border-border" style={{ width }}>
      <Story />
    </div>
  )
  return WidthDecorator
}

export const Fits: Story = {
  decorators: [widthDecorator('480px')],
}

export const Shrinks: Story = {
  decorators: [widthDecorator('240px')],
}

export const TruncatesBelowMinimum: Story = {
  decorators: [widthDecorator('140px')],
}

/** Drag the bottom-right corner to watch the text refit. */
export const Resizable: Story = {
  decorators: [
    (Story) => (
      <div className="resize-x overflow-hidden border border-dashed border-border p-2" style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
}
