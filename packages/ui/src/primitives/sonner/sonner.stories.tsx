import { useEffect } from 'react'
import type { Decorator, Meta, StoryObj } from '@storybook/react'
import { Toaster } from './sonner'
import { toast, type ToasterProps } from 'sonner'
import { Button } from '../button/button'

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

const withStorybookTheme: Decorator<ToasterProps> = (Story, { args, globals }) => {
  const dark = globals.theme ? globals.theme === 'dark' : document.documentElement.classList.contains('dark')
  return Story({ args: { ...args, theme: dark ? 'dark' : 'light' } })
}

const OpenDemo = (props: ToasterProps) => {
  useEffect(() => {
    toast.success('Success message', { duration: Infinity })
    toast.error('Error message', { duration: Infinity })
    toast('Toast with action', { duration: Infinity, action: { label: 'Undo', onClick: () => {} } })
  }, [])
  return (
    <div className="min-h-80">
      <Toaster position="bottom-right" {...props} />
    </div>
  )
}

export const Open: Story = {
  decorators: [withStorybookTheme],
  render: (args) => <OpenDemo {...args} />,
}

export const AllVariants: Story = {
  tags: ['skip-visual-test'],
  decorators: [withStorybookTheme],
  render: (args) => (
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
      <Toaster {...args} />
    </div>
  ),
}
