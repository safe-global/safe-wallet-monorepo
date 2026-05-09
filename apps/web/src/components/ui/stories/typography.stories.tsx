import type { Meta, StoryObj } from '@storybook/react'
import { Typography } from '../typography'

const meta = {
  title: 'UI/Typography',
  component: Typography,
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: 'var(--color-background-default)', padding: '2rem', minHeight: '100vh' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'h1',
        'h2',
        'h3',
        'h4',
        'paragraph',
        'paragraph-medium',
        'paragraph-bold',
        'paragraph-small',
        'paragraph-small-medium',
        'paragraph-mini',
        'paragraph-mini-medium',
        'paragraph-mini-bold',
        'code',
      ],
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right'],
    },
    color: {
      control: 'select',
      options: ['default', 'muted'],
    },
  },
} satisfies Meta<typeof Typography>

export default meta
type Story = StoryObj<typeof meta>

/**
 * All Figma typography variants. Default view.
 */
export const Default: Story = {
  tags: ['!chromatic'],
  args: {
    align: 'left',
  },
  parameters: {
    controls: { exclude: ['variant'] },
  },
  render: (args) => (
    <div className="space-y-8">
      <div>
        <Typography {...args} variant="h1">
          Heading 1 — 48px Semibold
        </Typography>
      </div>
      <div>
        <Typography {...args} variant="h2">
          Heading 2 — 30px Semibold
        </Typography>
      </div>
      <div>
        <Typography {...args} variant="h3">
          Heading 3 — 24px Semibold
        </Typography>
      </div>
      <div>
        <Typography {...args} variant="h4">
          Heading 4 — 20px Semibold
        </Typography>
      </div>
      <div>
        <Typography {...args} variant="paragraph">
          Paragraph — 16px Regular
        </Typography>
      </div>
      <div>
        <Typography {...args} variant="paragraph-medium">
          Paragraph medium — 16px Medium
        </Typography>
      </div>
      <div>
        <Typography {...args} variant="paragraph-bold">
          Paragraph bold — 16px Semibold
        </Typography>
      </div>
      <div>
        <Typography {...args} variant="paragraph-small">
          Paragraph small — 14px Regular
        </Typography>
      </div>
      <div>
        <Typography {...args} variant="paragraph-small-medium">
          Paragraph small medium — 14px Medium
        </Typography>
      </div>
      <div>
        <Typography {...args} variant="paragraph-mini">
          Paragraph mini — 12px Regular
        </Typography>
      </div>
      <div>
        <Typography {...args} variant="paragraph-mini-medium">
          Paragraph mini medium — 12px Medium
        </Typography>
      </div>
      <div>
        <Typography {...args} variant="paragraph-mini-bold">
          Paragraph mini bold — 12px Semibold
        </Typography>
      </div>
      <div>
        <Typography {...args} variant="code">
          Monospaced — 16px
        </Typography>
      </div>
    </div>
  ),
}

/**
 * Interactive playground to try variant, align, and text.
 */
export const Playground: Story = {
  args: {
    variant: 'paragraph',
    align: 'left',
    color: 'default',
    children:
      'The king, seeing how much happier his subjects were, realized the error of his ways and repealed the joke tax.',
  },
}
