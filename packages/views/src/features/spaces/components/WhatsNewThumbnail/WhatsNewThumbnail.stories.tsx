import type { Meta, StoryObj } from '@storybook/react'
import { WhatsNewThumbnail, WHATS_NEW_THUMBNAIL_VARIANTS } from './WhatsNewThumbnail'

const meta = {
  title: 'Features/Spaces/WhatsNewThumbnail',
  component: WhatsNewThumbnail,
  args: { variant: 'safe', className: 'h-40 w-32' },
  argTypes: { variant: { control: 'select', options: WHATS_NEW_THUMBNAIL_VARIANTS } },
} satisfies Meta<typeof WhatsNewThumbnail>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {WHATS_NEW_THUMBNAIL_VARIANTS.map((variant) => (
        <figure key={variant} className="flex flex-col items-center gap-2">
          <WhatsNewThumbnail variant={variant} className="h-40 w-32 rounded-lg" />
          <figcaption className="text-xs text-muted-foreground">{variant}</figcaption>
        </figure>
      ))}
    </div>
  ),
}
