import type { Meta, StoryObj } from '@storybook/react'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia } from '../empty'
import { Inbox } from 'lucide-react'

/**
 * Empty Component Stories
 *
 * Figma: No Figma design available
 */
const meta = {
  title: 'UI/Empty',
  component: Empty,
} satisfies Meta<typeof Empty>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Basic Empty</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '300px' }}>
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No items found</EmptyTitle>
                <EmptyDescription>Get started by creating a new item.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">With Icon</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '300px' }}>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Inbox />
                </EmptyMedia>
                <EmptyTitle>No messages</EmptyTitle>
                <EmptyDescription>You don&apos;t have any messages yet.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Content</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '300px' }}>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Inbox />
                </EmptyMedia>
                <EmptyTitle>No results</EmptyTitle>
                <EmptyDescription>Try adjusting your search criteria.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--color-primary)',
                    color: 'var(--color-primary-foreground)',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                  }}
                >
                  Clear filters
                </button>
              </EmptyContent>
            </Empty>
          </div>
        </div>
      </div>
    </div>
  ),
}
