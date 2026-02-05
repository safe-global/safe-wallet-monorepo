import type { Meta, StoryObj } from '@storybook/react'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../accordion'

/**
 * Accordion Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=66-5033
 */
const meta = {
  title: 'UI/Accordion',
  component: Accordion,
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Single (Default)</h3>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-6">
          <div className="w-full max-w-md">
            <Accordion defaultValue={['item-1']}>
              <AccordionItem value="item-1">
                <AccordionTrigger>Is it accessible?</AccordionTrigger>
                <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Is it styled?</AccordionTrigger>
                <AccordionContent>
                  Yes. It comes with default styles that match the other components&apos; aesthetic.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Is it animated?</AccordionTrigger>
                <AccordionContent>Yes. It&apos;s animated by default, but you can disable it.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Multiple</h3>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-6">
          <div className="w-full max-w-md">
            <Accordion multiple defaultValue={['item-1']}>
              <AccordionItem value="item-1">
                <AccordionTrigger>Item 1</AccordionTrigger>
                <AccordionContent>Content for item 1</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Item 2</AccordionTrigger>
                <AccordionContent>Content for item 2</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Item 3</AccordionTrigger>
                <AccordionContent>Content for item 3</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Disabled Items</h3>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-6">
          <div className="w-full max-w-md">
            <Accordion defaultValue={['item-1']}>
              <AccordionItem value="item-1">
                <AccordionTrigger>Enabled item</AccordionTrigger>
                <AccordionContent>This item can be toggled.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" disabled>
                <AccordionTrigger>Disabled item</AccordionTrigger>
                <AccordionContent>This content is not accessible.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Another enabled item</AccordionTrigger>
                <AccordionContent>This item works normally.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  ),
}
