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
      options: ['default', 'sm', 'lg', 'none'],
    },
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'muted'],
    },
    radius: {
      control: 'select',
      options: ['lg', 'xl', 'none'],
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
  tags: ['skip-visual-test'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Guidelines</h3>
        <Card variant="outlined" className="max-w-[720px]">
          <CardContent>
            <p className="mb-2">
              <strong>
                <code>className</code> is layout-only
              </strong>{' '}
              — width, margins, and flex/grid alignment. Spacing (gap/padding), radius, and surface
              (background/border/shadow) belong to the <code>size</code>, <code>radius</code>, and <code>variant</code>{' '}
              props. The Card-family ESLint guard enforces this.
            </p>
            <ul className="ml-4 list-disc">
              <li>
                Padding scale → <code>size</code>: <code>sm</code> (16px) · <code>default</code> (24px) ·{' '}
                <code>lg</code> (32px) · <code>none</code> (flush, own your own padding).
              </li>
              <li>
                Corners → <code>radius</code>: <code>lg</code> (default, 8px) · <code>xl</code> (12px) ·{' '}
                <code>none</code>.
              </li>
              <li>
                Surface → <code>variant</code>: <code>outlined</code> (hairline border) · <code>muted</code> (inset
                tint). Never hand-roll <code>border</code>/<code>bg-*</code>/<code>rounded-*</code>.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

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
          <div style={{ maxWidth: '100%', width: '350px' }}>
            <Card size="lg">
              <CardHeader>
                <CardTitle>Large Card</CardTitle>
                <CardDescription>Roomy padding and gaps (gap-8, py-8, slot px-8)</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Large size card content — use for hero/banner surfaces (replaces p-8).</p>
              </CardContent>
            </Card>
          </div>
          <div style={{ maxWidth: '100%', width: '300px' }}>
            <Card size="none">
              <CardContent>
                <div className="p-4">
                  <CardTitle>Flush Card</CardTitle>
                  <CardDescription>Root spacing and slot padding removed for custom layouts</CardDescription>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Variants</h3>
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
                <CardTitle>Default</CardTitle>
                <CardDescription>No border or elevation</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Use for plain grouped content on card surfaces.</p>
              </CardContent>
            </Card>
          </div>
          <div style={{ maxWidth: '100%', width: '300px' }}>
            <Card variant="outlined">
              <CardHeader>
                <CardTitle>Outlined</CardTitle>
                <CardDescription>Hairline border for nested cards</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Use instead of hand-rolling border classes.</p>
              </CardContent>
            </Card>
          </div>
          <div style={{ maxWidth: '100%', width: '300px' }}>
            <Card variant="muted">
              <CardHeader>
                <CardTitle>Muted</CardTitle>
                <CardDescription>Subtle inset surface</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Use for compact previews and decoded transaction lists.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Radius</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ maxWidth: '100%', width: '250px' }}>
            <Card radius="lg">
              <CardContent>
                <p>Default radius (8px)</p>
              </CardContent>
            </Card>
          </div>
          <div style={{ maxWidth: '100%', width: '250px' }}>
            <Card radius="xl">
              <CardContent>
                <p>Larger radius (12px)</p>
              </CardContent>
            </Card>
          </div>
          <div style={{ maxWidth: '100%', width: '250px' }}>
            <Card radius="none">
              <CardContent>
                <p>Flush edge</p>
              </CardContent>
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

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">With Image</h3>
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
              <img
                src="data:image/svg+xml;utf8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'300'%20height%3D'140'%3E%3Crect%20width%3D'300'%20height%3D'140'%20fill%3D'%236366f1'%2F%3E%3C%2Fsvg%3E"
                alt="Cover"
                width={300}
                height={140}
              />
              <CardHeader>
                <CardTitle>Image First Child</CardTitle>
                <CardDescription>
                  Top padding removed, image corners rounded (has-[&gt;img:first-child]:pt-0)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Media card with a leading cover image.</p>
              </CardContent>
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
