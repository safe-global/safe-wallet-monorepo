import type { Meta, StoryObj } from '@storybook/react'
import { Toaster } from '../sonner'
import { toast } from 'sonner'
import { Button } from '../button'

/**
 * Sonner Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-51943
 */
const meta = {
  title: 'UI/Sonner',
  component: Toaster,
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Toast Types</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, max-content))',
            gap: '1rem',
            justifyItems: 'start',
          }}
        >
          <Button
            onClick={() => {
              toast.success('Success message')
            }}
          >
            Success
          </Button>
          <Button
            onClick={() => {
              toast.error('Error message')
            }}
          >
            Error
          </Button>
          <Button
            onClick={() => {
              toast.info('Info message')
            }}
          >
            Info
          </Button>
          <Button
            onClick={() => {
              toast.warning('Warning message')
            }}
          >
            Warning
          </Button>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">With Actions</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1rem',
            justifyItems: 'start',
          }}
        >
          <Button
            onClick={() => {
              toast.success('Action completed', {
                action: {
                  label: 'Undo',
                  onClick: () => console.log('Undo'),
                },
              })
            }}
          >
            With Action
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Descriptions</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1rem',
            justifyItems: 'start',
          }}
        >
          <Button
            onClick={() => {
              toast.success('Success', {
                description: 'This is a success message with a description.',
              })
            }}
          >
            With Description
          </Button>
        </div>
      </div>
      <Toaster />
    </div>
  ),
}
