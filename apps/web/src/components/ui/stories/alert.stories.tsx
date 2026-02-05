import type { Meta, StoryObj } from '@storybook/react'
import { Alert, AlertTitle, AlertDescription, AlertAction } from '../alert'
import { AlertCircle, X } from 'lucide-react'
import { Button } from '../button'

/**
 * Alert Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-44439
 */
const meta = {
  title: 'UI/Alert',
  component: Alert,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
    },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Variants</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '400px' }}>
            <Alert>
              <AlertTitle>Default Alert</AlertTitle>
              <AlertDescription>This is a default alert message.</AlertDescription>
            </Alert>
          </div>
          <div style={{ width: '400px' }}>
            <Alert variant="destructive">
              <AlertTitle>Destructive Alert</AlertTitle>
              <AlertDescription>This is a destructive alert message.</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">With Icon</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '400px' }}>
            <Alert>
              <AlertCircle />
              <AlertTitle>Alert with Icon</AlertTitle>
              <AlertDescription>This alert includes an icon.</AlertDescription>
            </Alert>
          </div>
          <div style={{ width: '400px' }}>
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Destructive with Icon</AlertTitle>
              <AlertDescription>This destructive alert includes an icon.</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Action</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '400px' }}>
            <Alert>
              <AlertTitle>Alert with Action</AlertTitle>
              <AlertDescription>This alert has an action button.</AlertDescription>
              <AlertAction>
                <Button variant="ghost" size="sm">
                  <X />
                </Button>
              </AlertAction>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  ),
}
