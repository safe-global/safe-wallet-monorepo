import type { Meta, StoryObj } from '@storybook/react'
import { Kbd, KbdGroup } from '../kbd'

/**
 * KBD Component Stories
 *
 * Figma: No Figma design available
 */
const meta = {
  title: 'UI/KBD',
  component: Kbd,
  argTypes: {
    children: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Kbd>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Single Keys</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, max-content))',
            gap: '1rem',
            justifyItems: 'start',
            alignItems: 'center',
          }}
        >
          <Kbd>A</Kbd>
          <Kbd>Ctrl</Kbd>
          <Kbd>Shift</Kbd>
          <Kbd>Enter</Kbd>
          <Kbd>Esc</Kbd>
          <Kbd>?</Kbd>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Key Combinations</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1rem',
            justifyItems: 'start',
            alignItems: 'center',
          }}
        >
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
          <KbdGroup>
            <Kbd>Cmd</Kbd>
            <Kbd>S</Kbd>
          </KbdGroup>
          <KbdGroup>
            <Kbd>Alt</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>P</Kbd>
          </KbdGroup>
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>Alt</Kbd>
            <Kbd>Del</Kbd>
          </KbdGroup>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">In Text</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p className="text-sm">
            Press <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> to open command palette
          </p>
          <p className="text-sm">
            Use{' '}
            <KbdGroup>
              <Kbd>Cmd</Kbd>
              <Kbd>C</Kbd>
            </KbdGroup>{' '}
            to copy
          </p>
        </div>
      </div>
    </div>
  ),
}
