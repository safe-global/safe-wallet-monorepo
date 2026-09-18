import type { Meta, StoryObj } from '@storybook/react'
import { Drawer } from './Drawer'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

const meta = {
  title: 'Components/Common/Drawer',
  component: Drawer,
  tags: ['autodocs', 'skip-visual-test'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    open: true,
    onClose: () => {},
  },
} satisfies Meta<typeof Drawer>

export default meta
type Story = StoryObj<typeof meta>

const Paragraphs = ({ count }: { count: number }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <Typography key={i} variant="paragraph-small" className="mb-4">
        Paragraph {i + 1} — the drawer body does not scroll on its own; the content decides.
      </Typography>
    ))}
  </>
)

export const Full: Story = {
  args: {
    ariaLabel: 'Full drawer',
    icon: <div className="size-7 rounded-full bg-primary" />,
    title: 'Operations Vault',
    subtitle: 'Last updated 2 minutes ago',
    action: <Button className="w-full">Confirm</Button>,
    children: <Paragraphs count={3} />,
  },
}

export const OnlyTitle: Story = {
  args: {
    ariaLabel: 'Title only drawer',
    title: 'Batched transactions',
    children: <Paragraphs count={3} />,
  },
}

export const TitleWithAction: Story = {
  args: {
    ariaLabel: 'Drawer with an action',
    title: 'Batched transactions',
    subtitle: '3 transactions queued',
    action: <Button className="w-full">Confirm batch</Button>,
    children: <Paragraphs count={3} />,
  },
}

export const NoHeader: Story = {
  args: {
    ariaLabel: 'Headerless drawer',
    children: <Paragraphs count={3} />,
  },
}

export const LongContent: Story = {
  args: {
    ariaLabel: 'Scrolling drawer',
    title: 'Scrolling body',
    action: <Button className="w-full">Confirm</Button>,
    children: (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Paragraphs count={30} />
      </div>
    ),
  },
}

export const SizeLg: Story = {
  args: {
    ariaLabel: 'Wide drawer',
    size: 'lg',
    title: 'Wide drawer',
    children: <Paragraphs count={3} />,
  },
}
