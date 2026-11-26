import type { Meta, StoryObj } from '@storybook/react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../drawer'
import { Button } from '../button'

/**
 * Drawer Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-52050
 */
const meta = {
  title: 'UI/Drawer',
  component: Drawer,
  argTypes: {
    open: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Drawer>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  render: () => (
    <Drawer defaultOpen>
      <DrawerTrigger render={<Button />}>Open drawer</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Drawer title</DrawerTitle>
          <DrawerDescription>Drawer description goes here.</DrawerDescription>
        </DrawerHeader>
        <div style={{ padding: '1rem' }}>
          <p className="text-sm">Drawer content area.</p>
        </div>
        <DrawerFooter>
          <Button>Save</Button>
          <DrawerClose render={<Button variant="outline" />}>Cancel</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
}

export const Right: Story = {
  render: () => (
    <Drawer direction="right" defaultOpen>
      <DrawerTrigger render={<Button />}>Open drawer</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Drawer title</DrawerTitle>
          <DrawerDescription>Drawer description goes here.</DrawerDescription>
        </DrawerHeader>
        <div style={{ padding: '1rem' }}>
          <p className="text-sm">Drawer content area.</p>
        </div>
      </DrawerContent>
    </Drawer>
  ),
}

export const AllVariants: Story = {
  tags: ['skip-visual-test'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Basic Drawer</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <Drawer>
            <DrawerTrigger render={<Button />}>Open drawer</DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Drawer title</DrawerTitle>
                <DrawerDescription>Drawer description goes here.</DrawerDescription>
              </DrawerHeader>
              <div style={{ padding: '1rem' }}>
                <p className="text-sm">Drawer content area.</p>
              </div>
              <DrawerFooter>
                <Button>Save</Button>
                <DrawerClose render={<Button variant="outline" />}>Cancel</DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Footer</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <Drawer>
            <DrawerTrigger render={<Button />}>Open with footer</DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Drawer with footer</DrawerTitle>
                <DrawerDescription>This drawer includes a footer with actions.</DrawerDescription>
              </DrawerHeader>
              <div style={{ padding: '1rem' }}>
                <p className="text-sm">Content goes here.</p>
              </div>
              <DrawerFooter>
                <Button>Submit</Button>
                <DrawerClose render={<Button variant="outline" />}>Cancel</DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </div>
  ),
}
