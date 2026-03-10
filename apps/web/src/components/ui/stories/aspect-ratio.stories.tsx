import type { Meta, StoryObj } from '@storybook/react'
import { AspectRatio } from '../aspect-ratio'

/**
 * AspectRatio Component Stories
 *
 * Figma: No Figma design available
 */
const meta = {
  title: 'UI/AspectRatio',
  component: AspectRatio,
  argTypes: {
    ratio: {
      control: 'number',
    },
  },
} satisfies Meta<typeof AspectRatio>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  args: { ratio: 16 / 9 },
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Common Ratios</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '250px' }}>
            <AspectRatio ratio={16 / 9}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'var(--color-muted)',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-muted-foreground)',
                }}
              >
                16:9
              </div>
            </AspectRatio>
          </div>
          <div style={{ width: '250px' }}>
            <AspectRatio ratio={4 / 3}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'var(--color-muted)',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-muted-foreground)',
                }}
              >
                4:3
              </div>
            </AspectRatio>
          </div>
          <div style={{ width: '250px' }}>
            <AspectRatio ratio={1}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'var(--color-muted)',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-muted-foreground)',
                }}
              >
                1:1
              </div>
            </AspectRatio>
          </div>
          <div style={{ width: '250px' }}>
            <AspectRatio ratio={21 / 9}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'var(--color-muted)',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-muted-foreground)',
                }}
              >
                21:9
              </div>
            </AspectRatio>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Image</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '300px' }}>
            <AspectRatio ratio={16 / 9}>
              <img
                src="https://github.com/shadcn.png"
                alt="Sample"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </AspectRatio>
          </div>
          <div style={{ width: '300px' }}>
            <AspectRatio ratio={4 / 3}>
              <img
                src="https://github.com/vercel.png"
                alt="Sample"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </AspectRatio>
          </div>
          <div style={{ width: '300px' }}>
            <AspectRatio ratio={1}>
              <img
                src="https://github.com/shadcn.png"
                alt="Sample"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </AspectRatio>
          </div>
        </div>
      </div>
    </div>
  ),
}
