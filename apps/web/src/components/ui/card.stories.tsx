import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from './card'
import { Button } from './button'

const meta = {
  title: 'UI/Card',
  component: Card,
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm'],
    },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Sizes</h3>
        <div className="flex gap-6">
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>Standard padding and gaps (gap-6, py-6)</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Default size card content.</p>
            </CardContent>
            <CardFooter>
              <Button>Action</Button>
            </CardFooter>
          </Card>
          <Card size="sm" className="w-[300px]">
            <CardHeader>
              <CardTitle>Small Card</CardTitle>
              <CardDescription>Compact padding and gaps (gap-4, py-4)</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Small size card content.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Compositions</h3>
        <div className="flex gap-6">
          <Card className="w-[300px]">
            <CardHeader>
              <CardTitle>With Action</CardTitle>
              <CardDescription>Header action button</CardDescription>
              <CardAction>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p>Card with header action.</p>
            </CardContent>
          </Card>
          <Card className="w-[250px]">
            <CardHeader>
              <CardTitle>Header Only</CardTitle>
              <CardDescription>No content or footer</CardDescription>
            </CardHeader>
          </Card>
          <Card className="w-[250px]">
            <CardContent>
              <p>Content only - no header or footer.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  ),
}

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content with some example text.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
  args: {
    size: 'default',
  },
}

export const Small: Story = {
  render: (args) => (
    <Card {...args} className="w-[300px]">
      <CardHeader>
        <CardTitle>Small Card</CardTitle>
        <CardDescription>Compact card variant</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Smaller padding and gaps.</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Action</Button>
      </CardFooter>
    </Card>
  ),
  args: {
    size: 'sm',
  },
}

export const WithAction: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card with Action</CardTitle>
        <CardDescription>Header includes an action button</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>The CardAction component positions a button in the top right.</p>
      </CardContent>
    </Card>
  ),
}

export const HeaderOnly: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Header Only Card</CardTitle>
        <CardDescription>Sometimes you just need a header</CardDescription>
      </CardHeader>
    </Card>
  ),
}

export const ContentOnly: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardContent>
        <p>A card with only content, no header or footer.</p>
      </CardContent>
    </Card>
  ),
}

export const FormExample: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Contact us</CardTitle>
        <CardDescription>Contact us and we&apos;ll get back to you as soon as possible.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Name</label>
          <input
            type="text"
            placeholder="Enter your name..."
            className="rounded-lg border border-border bg-input px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">E-mail address</label>
          <input
            type="email"
            placeholder="Enter your e-mail address..."
            className="rounded-lg border border-border bg-input px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Message</label>
          <textarea
            placeholder="Type your message here."
            className="rounded-lg border border-border bg-input px-3 py-2 text-sm"
            rows={3}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Send message</Button>
      </CardFooter>
    </Card>
  ),
}
