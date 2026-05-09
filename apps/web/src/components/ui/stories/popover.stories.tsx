import type { Meta, StoryObj } from '@storybook/react'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '../popover'
import { Button } from '../button'

/**
 * Popover Component Stories
 *
 * Figma: No Figma design available
 */
const meta = {
  title: 'UI/Popover',
  component: Popover,
  argTypes: {
    open: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Popover>

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
          <Popover>
            <PopoverTrigger render={<Button>Top</Button>} />
            <PopoverContent side="top">
              <PopoverHeader>
                <PopoverTitle>Top Popover</PopoverTitle>
                <PopoverDescription>Popover appears above the trigger.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger render={<Button>Bottom</Button>} />
            <PopoverContent side="bottom">
              <PopoverHeader>
                <PopoverTitle>Bottom Popover</PopoverTitle>
                <PopoverDescription>Popover appears below the trigger.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger render={<Button>Left</Button>} />
            <PopoverContent side="left">
              <PopoverHeader>
                <PopoverTitle>Left Popover</PopoverTitle>
                <PopoverDescription>Popover appears to the left.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger render={<Button>Right</Button>} />
            <PopoverContent side="right">
              <PopoverHeader>
                <PopoverTitle>Right Popover</PopoverTitle>
                <PopoverDescription>Popover appears to the right.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
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
          <Popover>
            <PopoverTrigger render={<Button>Open Popover</Button>} />
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>Popover Title</PopoverTitle>
                <PopoverDescription>Popover description text.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  ),
}
