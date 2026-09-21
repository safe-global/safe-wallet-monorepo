import type { Meta, StoryObj } from '@storybook/react'
import { ExternalLink } from 'lucide-react'
import { Link } from '../link'

const meta = {
  title: 'UI/Link',
  component: Link,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'muted', 'inherit'],
    },
  },
} satisfies Meta<typeof Link>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { href: '#', children: 'Default link' },
}

export const Muted: Story = {
  args: { href: '#', variant: 'muted', children: 'Muted link' },
}

export const AllVariants: Story = {
  tags: ['skip-visual-test'],
  render: () => (
    <div style={{ display: 'flex', gap: '1.5rem' }}>
      <Link href="#" variant="default">
        Default
      </Link>
      <Link href="#" variant="muted">
        Muted
      </Link>
      <Link href="#" variant="inherit">
        Inherit
      </Link>
      <Link href="#" variant="default">
        <ExternalLink /> With icon
      </Link>
    </div>
  ),
}
