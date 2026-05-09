import type { Meta, StoryObj } from '@storybook/react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../hover-card'
import { Button } from '../button'

/**
 * HoverCard Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-52051
 */
const meta = {
  title: 'UI/HoverCard',
  component: HoverCard,
  argTypes: {
    open: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof HoverCard>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Positions</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, max-content))',
            gap: '1rem',
            justifyItems: 'start',
          }}
        >
          <HoverCard>
            <HoverCardTrigger render={<Button>Top</Button>} />
            <HoverCardContent side="top">
              <div>
                <h4 className="text-sm font-semibold mb-1">Hover Card</h4>
                <p className="text-sm text-muted-foreground">Content appears on top</p>
              </div>
            </HoverCardContent>
          </HoverCard>
          <HoverCard>
            <HoverCardTrigger render={<Button>Bottom</Button>} />
            <HoverCardContent side="bottom">
              <div>
                <h4 className="text-sm font-semibold mb-1">Hover Card</h4>
                <p className="text-sm text-muted-foreground">Content appears below</p>
              </div>
            </HoverCardContent>
          </HoverCard>
          <HoverCard>
            <HoverCardTrigger render={<Button>Left</Button>} />
            <HoverCardContent side="left">
              <div>
                <h4 className="text-sm font-semibold mb-1">Hover Card</h4>
                <p className="text-sm text-muted-foreground">Content appears to the left</p>
              </div>
            </HoverCardContent>
          </HoverCard>
          <HoverCard>
            <HoverCardTrigger render={<Button>Right</Button>} />
            <HoverCardContent side="right">
              <div>
                <h4 className="text-sm font-semibold mb-1">Hover Card</h4>
                <p className="text-sm text-muted-foreground">Content appears to the right</p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Content</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <HoverCard>
            <HoverCardTrigger render={<Button variant="link">@username</Button>} />
            <HoverCardContent>
              <div>
                <h4 className="text-sm font-semibold mb-1">User Profile</h4>
                <p className="text-sm text-muted-foreground mb-2">@username</p>
                <p className="text-sm">User description and details go here.</p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
    </div>
  ),
}
