import type { Meta, StoryObj } from '@storybook/react'
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount } from '../avatar'
import { Check } from 'lucide-react'

/**
 * Avatar Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-44440
 */
const meta = {
  title: 'UI/Avatar',
  component: Avatar,
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
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Sizes</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Avatar size="default">
              <AvatarImage src="https://github.com/shadcn.png" alt="Default" />
              <AvatarFallback>DF</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">default (40px)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Avatar size="sm">
              <AvatarImage src="https://github.com/shadcn.png" alt="Small" />
              <AvatarFallback>SM</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">sm (32px)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Avatar size="xs">
              <AvatarImage src="https://github.com/shadcn.png" alt="Extra Small" />
              <AvatarFallback>XS</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">xs (24px)</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">With Fallback</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(60px, max-content))',
            gap: '1rem',
            justifyItems: 'start',
          }}
        >
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

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">With Badge</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(60px, max-content))',
            gap: '1rem',
            justifyItems: 'start',
          }}
        >
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
        <div style={{ display: 'block' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
