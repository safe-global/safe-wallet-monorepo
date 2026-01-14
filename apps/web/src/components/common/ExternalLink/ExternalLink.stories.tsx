import type { Meta, StoryObj } from '@storybook/react'
import ExternalLink from './index'

const meta = {
  component: ExternalLink,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ExternalLink>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    href: 'https://safe.global',
    children: 'Visit Safe Global',
  },
}

export const WithoutIcon: Story = {
  args: {
    href: 'https://safe.global',
    children: 'Visit Safe Global',
    noIcon: true,
  },
}

export const ButtonMode: Story = {
  args: {
    href: 'https://safe.global',
    children: 'Open Documentation',
    mode: 'button',
  },
}

export const NoChildren: Story = {
  args: {
    href: 'https://safe.global',
  },
}

export const EmptyHref: Story = {
  args: {
    href: '',
    children: 'This will not be a link',
  },
}

export const WithCustomStyling: Story = {
  args: {
    href: 'https://etherscan.io',
    children: 'View on Etherscan',
    sx: { color: 'secondary.main', fontWeight: 'bold' },
  },
}
