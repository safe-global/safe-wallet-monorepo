import type { Meta, StoryObj } from '@storybook/react'
import DesignFeedback from './DesignFeedback'

// A sample page. `data-prototype-element` names the area a pin lands on.
const SamplePage = () => (
  <div className="flex flex-col gap-4 p-6">
    <header data-prototype-element="Header" className="rounded-lg bg-card p-4 text-sm font-medium">
      Sample prototype
    </header>
    <section data-prototype-element="Table" className="rounded-lg bg-card p-4 text-sm">
      Press C, then click anywhere to pin a comment.
    </section>
  </div>
)

const meta = {
  title: 'Features/Design feedback/Design feedback',
  component: DesignFeedback,
  parameters: { layout: 'fullscreen' },
  args: { target: { workspace: 'safe-global', ticket: 'DES-1', team: 'DES', project: 'Design feedback' } },
  decorators: [
    (Story) => (
      <>
        <SamplePage />
        <Story />
      </>
    ),
  ],
} satisfies Meta<typeof DesignFeedback>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
