import type { Meta, StoryObj } from '@storybook/react'
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip'
import { Button } from '../button'
import { Link } from '../link'

/**
 * Tooltip Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-44449
 */
const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  argTypes: {
    open: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  render: () => (
    <div className="flex min-h-32 items-end justify-center pb-2">
      <Tooltip open>
        <TooltipTrigger render={<Button>Hover me</Button>} />
        <TooltipContent side="top">
          <p>Tooltip content</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
}

export const AllVariants: Story = {
  tags: ['skip-visual-test'],
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
          <Tooltip>
            <TooltipTrigger render={<Button>Top</Button>} />
            <TooltipContent side="top">
              <p>Tooltip on top</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<Button>Bottom</Button>} />
            <TooltipContent side="bottom">
              <p>Tooltip on bottom</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<Button>Left</Button>} />
            <TooltipContent side="left">
              <p>Tooltip on left</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<Button>Right</Button>} />
            <TooltipContent side="right">
              <p>Tooltip on right</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Text</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <Tooltip>
            <TooltipTrigger render={<Button>Hover me</Button>} />
            <TooltipContent>
              <p>This is a tooltip message</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<Button variant="outline">Long tooltip</Button>} />
            <TooltipContent>
              <p>This is a longer tooltip message that wraps to multiple lines</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  ),
}

/**
 * The tooltip is an inverted surface (`bg-foreground text-background`), so `Link`'s default
 * `text-primary` would be near-invisible on it in both themes. Keeps that regression covered.
 */
export const WithLink: Story = {
  render: () => (
    <div className="flex min-h-32 items-end justify-center pb-2">
      <Tooltip open>
        <TooltipTrigger render={<Button variant="outline">Tooltip with a link</Button>} />
        <TooltipContent side="bottom">
          A standard transaction requires the signatures of other signers.{' '}
          <Link href="https://help.safe.global">Learn more about spending limits</Link>.
        </TooltipContent>
      </Tooltip>
    </div>
  ),
}
