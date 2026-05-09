import type { Meta, StoryObj } from '@storybook/react'
import { Progress, ProgressTrack, ProgressIndicator, ProgressLabel, ProgressValue } from '../progress'

/**
 * Progress Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49187
 */
const meta = {
  title: 'UI/Progress',
  component: Progress,
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100 },
    },
  },
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  args: { value: 0 },
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Progress Values</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '300px' }}>
            <Progress value={0}>
              <ProgressTrack>
                <ProgressIndicator />
              </ProgressTrack>
            </Progress>
          </div>
          <div style={{ width: '300px' }}>
            <Progress value={25}>
              <ProgressTrack>
                <ProgressIndicator />
              </ProgressTrack>
            </Progress>
          </div>
          <div style={{ width: '300px' }}>
            <Progress value={50}>
              <ProgressTrack>
                <ProgressIndicator />
              </ProgressTrack>
            </Progress>
          </div>
          <div style={{ width: '300px' }}>
            <Progress value={75}>
              <ProgressTrack>
                <ProgressIndicator />
              </ProgressTrack>
            </Progress>
          </div>
          <div style={{ width: '300px' }}>
            <Progress value={100}>
              <ProgressTrack>
                <ProgressIndicator />
              </ProgressTrack>
            </Progress>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Label and Value</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '300px' }}>
            <Progress value={45}>
              <ProgressLabel>Upload progress</ProgressLabel>
              <ProgressValue />
              <ProgressTrack>
                <ProgressIndicator />
              </ProgressTrack>
            </Progress>
          </div>
          <div style={{ width: '300px' }}>
            <Progress value={80}>
              <ProgressLabel>Download progress</ProgressLabel>
              <ProgressValue />
              <ProgressTrack>
                <ProgressIndicator />
              </ProgressTrack>
            </Progress>
          </div>
        </div>
      </div>
    </div>
  ),
}
