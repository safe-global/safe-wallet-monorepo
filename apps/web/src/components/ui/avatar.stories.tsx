import type { Meta, StoryObj } from '@storybook/react'
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount } from './avatar'
import { Check } from 'lucide-react'

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default'],
    },
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Sizes</h3>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar size="default">
              <AvatarImage src="https://github.com/shadcn.png" alt="Default" />
              <AvatarFallback>DF</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">default (40px)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar size="sm">
              <AvatarImage src="https://github.com/shadcn.png" alt="Small" />
              <AvatarFallback>SM</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">sm (32px)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar size="xs">
              <AvatarImage src="https://github.com/shadcn.png" alt="Extra Small" />
              <AvatarFallback>XS</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">xs (24px)</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Fallback</h3>
        <div className="flex items-center gap-4">
          <Avatar size="default">
            <AvatarFallback>DF</AvatarFallback>
          </Avatar>
          <Avatar size="sm">
            <AvatarFallback>SM</AvatarFallback>
          </Avatar>
          <Avatar size="xs">
            <AvatarFallback>XS</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Badge</h3>
        <div className="flex items-center gap-4">
          <Avatar size="default">
            <AvatarImage src="https://github.com/shadcn.png" alt="Default" />
            <AvatarFallback>DF</AvatarFallback>
            <AvatarBadge>
              <Check />
            </AvatarBadge>
          </Avatar>
          <Avatar size="sm">
            <AvatarImage src="https://github.com/shadcn.png" alt="Small" />
            <AvatarFallback>SM</AvatarFallback>
            <AvatarBadge />
          </Avatar>
          <Avatar size="xs">
            <AvatarImage src="https://github.com/shadcn.png" alt="Extra Small" />
            <AvatarFallback>XS</AvatarFallback>
            <AvatarBadge />
          </Avatar>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Avatar Group</h3>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className="w-20 text-sm text-muted-foreground">Default</span>
            <AvatarGroup>
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="User 1" />
                <AvatarFallback>U1</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage src="https://github.com/vercel.png" alt="User 2" />
                <AvatarFallback>U2</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>U3</AvatarFallback>
              </Avatar>
              <AvatarGroupCount>+3</AvatarGroupCount>
            </AvatarGroup>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-20 text-sm text-muted-foreground">Small</span>
            <AvatarGroup>
              <Avatar size="sm">
                <AvatarImage src="https://github.com/shadcn.png" alt="User 1" />
                <AvatarFallback>U1</AvatarFallback>
              </Avatar>
              <Avatar size="sm">
                <AvatarImage src="https://github.com/vercel.png" alt="User 2" />
                <AvatarFallback>U2</AvatarFallback>
              </Avatar>
              <Avatar size="sm">
                <AvatarFallback>U3</AvatarFallback>
              </Avatar>
              <AvatarGroupCount>+3</AvatarGroupCount>
            </AvatarGroup>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-20 text-sm text-muted-foreground">Extra Small</span>
            <AvatarGroup>
              <Avatar size="xs">
                <AvatarImage src="https://github.com/shadcn.png" alt="User 1" />
                <AvatarFallback>U1</AvatarFallback>
              </Avatar>
              <Avatar size="xs">
                <AvatarImage src="https://github.com/vercel.png" alt="User 2" />
                <AvatarFallback>U2</AvatarFallback>
              </Avatar>
              <Avatar size="xs">
                <AvatarFallback>U3</AvatarFallback>
              </Avatar>
              <AvatarGroupCount>+3</AvatarGroupCount>
            </AvatarGroup>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const Placeholder: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Placeholder Sizes</h3>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar size="default">
              <AvatarFallback>DF</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">default (40px)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>SM</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">sm (32px)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar size="xs">
              <AvatarFallback>XS</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">xs (24px)</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Placeholder Initials</h3>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>AB</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>XY</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>?</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Placeholder Group</h3>
        <AvatarGroup>
          <Avatar>
            <AvatarFallback>U1</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>U2</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>U3</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>U4</AvatarFallback>
          </Avatar>
          <AvatarGroupCount>+2</AvatarGroupCount>
        </AvatarGroup>
      </div>
    </div>
  ),
}

export const Default: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
  args: {
    size: 'default',
  },
}

export const Small: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
  args: {
    size: 'sm',
  },
}

export const ExtraSmall: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
  args: {
    size: 'xs',
  },
}

export const WithFallback: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="invalid-url.png" alt="User" />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
}

export const WithBadge: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
      <AvatarBadge />
    </Avatar>
  ),
}

export const WithBadgeIcon: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
      <AvatarBadge>
        <Check />
      </AvatarBadge>
    </Avatar>
  ),
}

export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="User 1" />
        <AvatarFallback>U1</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://github.com/vercel.png" alt="User 2" />
        <AvatarFallback>U2</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>U3</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+5</AvatarGroupCount>
    </AvatarGroup>
  ),
}
