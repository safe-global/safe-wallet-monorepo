import type { Meta, StoryObj } from '@storybook/react'
import { Typography } from '@/components/ui/typography'
import ImageFallback from './index'

const meta = {
  title: 'Components/Common/ImageFallback',
  component: ImageFallback,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ImageFallback>

export default meta
type Story = StoryObj<typeof meta>

export const WithValidImage: Story = {
  args: {
    src: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
    fallbackSrc: '/images/common/token-placeholder.svg',
    alt: 'Ethereum logo',
    width: 48,
    height: 48,
  },
}

export const WithFallbackSrc: Story = {
  args: {
    src: 'https://invalid-url.com/broken-image.png',
    fallbackSrc: '/images/common/token-placeholder.svg',
    alt: 'Token placeholder',
    width: 48,
    height: 48,
  },
}

export const WithFallbackComponent: Story = {
  args: {
    src: 'https://invalid-url.com/broken-image.png',
    fallbackComponent: (
      <div className="bg-primary flex size-12 items-center justify-center rounded-full">
        <Typography variant="paragraph-bold" className="text-primary-foreground">
          ?
        </Typography>
      </div>
    ),
    alt: 'Unknown',
    width: 48,
    height: 48,
  },
}

export const SmallSize: Story = {
  args: {
    src: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
    fallbackSrc: '/images/common/token-placeholder.svg',
    alt: 'Small image',
    width: 24,
    height: 24,
  },
}

export const LargeSize: Story = {
  args: {
    src: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
    fallbackSrc: '/images/common/token-placeholder.svg',
    alt: 'Large image',
    width: 96,
    height: 96,
  },
}
