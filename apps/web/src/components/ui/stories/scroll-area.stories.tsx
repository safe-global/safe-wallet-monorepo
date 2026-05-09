import type { Meta, StoryObj } from '@storybook/react'
import { ScrollArea, ScrollBar } from '../scroll-area'
import { Separator } from '../separator'

/**
 * ScrollArea Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-52054
 */
const meta = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
} satisfies Meta<typeof ScrollArea>

export default meta
type Story = StoryObj<typeof meta>

const tags = Array.from({ length: 50 }).map((_, i) => `v1.2.0-beta.${50 - i}`)

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Vertical</h3>
        <ScrollArea className="h-72 w-48 rounded-md border">
          <div className="p-4">
            <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
            {tags.map((tag) => (
              <div key={tag}>
                <div className="text-sm">{tag}</div>
                <Separator className="my-2" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Horizontal</h3>
        <ScrollArea className="w-96 whitespace-nowrap rounded-md border">
          <div className="flex w-max gap-4 p-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="shrink-0 rounded-md border bg-muted/50 px-8 py-6">
                <span className="text-sm font-medium">Item {i + 1}</span>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  ),
}
