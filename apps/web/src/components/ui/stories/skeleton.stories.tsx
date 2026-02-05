import type { Meta, StoryObj } from '@storybook/react'
import { Skeleton } from '../skeleton'

/**
 * Skeleton Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-52052
 */
const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  argTypes: {
    className: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Shapes</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '200px' }}>
            <Skeleton style={{ height: '20px', width: '100%' }} />
          </div>
          <div style={{ width: '150px' }}>
            <Skeleton style={{ height: '150px', width: '150px', borderRadius: '50%' }} />
          </div>
          <div style={{ width: '200px' }}>
            <Skeleton style={{ height: '100px', width: '100%' }} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Text Lines</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Skeleton style={{ height: '20px', width: '100%' }} />
            <Skeleton style={{ height: '20px', width: '80%' }} />
            <Skeleton style={{ height: '20px', width: '90%' }} />
          </div>
          <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Skeleton style={{ height: '24px', width: '60%' }} />
            <Skeleton style={{ height: '16px', width: '100%' }} />
            <Skeleton style={{ height: '16px', width: '100%' }} />
            <Skeleton style={{ height: '16px', width: '70%' }} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Card Skeleton</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div
            style={{
              width: '300px',
              padding: '1rem',
              border: '1px solid var(--color-border)',
              borderRadius: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <Skeleton style={{ height: '150px', width: '100%' }} />
            <Skeleton style={{ height: '20px', width: '80%' }} />
            <Skeleton style={{ height: '16px', width: '100%' }} />
            <Skeleton style={{ height: '16px', width: '60%' }} />
          </div>
        </div>
      </div>
    </div>
  ),
}
