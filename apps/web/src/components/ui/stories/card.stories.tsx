import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from '../card'
import { Button } from '../button'

/**
 * Card Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/?node-id=179:29234
 */
const meta = {
  title: 'UI/Card',
  component: Card,
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm'],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: 'var(--color-background-default)', padding: '2rem', minHeight: '100vh' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>

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
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ maxWidth: '100%', width: '350px' }}>
            <Card>
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
          </div>
          <div style={{ maxWidth: '100%', width: '300px' }}>
            <Card size="sm">
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
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Compositions</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ maxWidth: '100%', width: '300px' }}>
            <Card>
              <CardHeader>
                <CardTitle>Full Card</CardTitle>
                <CardDescription>Header, content, and footer</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Complete card with all sections.</p>
              </CardContent>
              <CardFooter>
                <Button>Action</Button>
              </CardFooter>
            </Card>
          </div>
          <div style={{ maxWidth: '100%', width: '300px' }}>
            <Card>
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
                <p>Card with header action button.</p>
              </CardContent>
            </Card>
          </div>
          <div style={{ maxWidth: '100%', width: '250px' }}>
            <Card>
              <CardHeader>
                <CardTitle>Header Only</CardTitle>
                <CardDescription>No content or footer</CardDescription>
              </CardHeader>
            </Card>
          </div>
          <div style={{ maxWidth: '100%', width: '250px' }}>
            <Card>
              <CardContent>
                <p>Content only - no header or footer.</p>
              </CardContent>
            </Card>
          </div>
          <div style={{ maxWidth: '100%', width: '250px' }}>
            <Card>
              <CardHeader>
                <CardTitle>Header + Footer</CardTitle>
              </CardHeader>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>
          </div>
          <div style={{ maxWidth: '100%', width: '250px' }}>
            <Card>
              <CardContent>
                <p>Content with footer only.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">All Sizes × Compositions</h3>
        <div style={{ display: 'block' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Default Size</h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, max-content))',
                gap: '1.5rem',
                justifyItems: 'start',
              }}
            >
              <div style={{ maxWidth: '100%', width: '280px' }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Description text</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Content area.</p>
                  </CardContent>
                  <CardFooter>
                    <Button size="sm">Action</Button>
                  </CardFooter>
                </Card>
              </div>
              <div style={{ maxWidth: '100%', width: '280px' }}>
                <Card size="sm">
                  <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Description text</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Content area.</p>
                  </CardContent>
                  <CardFooter>
                    <Button size="sm">Action</Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}
