import type { Meta, StoryObj } from '@storybook/react'
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip'
import { Button } from '../button'

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
