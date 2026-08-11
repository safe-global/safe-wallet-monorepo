import type { Meta, StoryObj } from '@storybook/react'
import ChainIndicator from './index'
import { StoreDecorator } from '@/stories/storeDecorator'

const meta = {
  title: 'Components/Common/ChainIndicator',
  component: ChainIndicator,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{}}>
        <div className="rounded-lg bg-[var(--color-background-paper)] p-4">
          <Story />
        </div>
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof ChainIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    chainId: '1',
  },
}

export const OnlyLogo: Story = {
  tags: ['skip-visual-test'],
  args: {
    chainId: '1',
    onlyLogo: true,
  },
}

export const Inline: Story = {
  tags: ['skip-visual-test'],
  args: {
    chainId: '1',
    inline: true,
  },
}

export const WithFiatValue: Story = {
  tags: ['skip-visual-test'],
  args: {
    chainId: '1',
    fiatValue: '1234.56',
  },
}

export const Responsive: Story = {
  tags: ['skip-visual-test'],
  args: {
    chainId: '1',
    responsive: true,
  },
}

export const NoLogo: Story = {
  tags: ['skip-visual-test'],
  args: {
    chainId: '1',
    showLogo: false,
  },
}

export const UnknownChain: Story = {
  args: {
    chainId: '999999',
    showUnknown: true,
  },
}

export const HideUnknown: Story = {
  tags: ['skip-visual-test'],
  args: {
    chainId: '999999',
    showUnknown: false,
  },
}

export const SmallImage: Story = {
  tags: ['skip-visual-test'],
  args: {
    chainId: '1',
    imageSize: 16,
  },
}

export const LargeImage: Story = {
  tags: ['skip-visual-test'],
  args: {
    chainId: '1',
    imageSize: 36,
  },
}
