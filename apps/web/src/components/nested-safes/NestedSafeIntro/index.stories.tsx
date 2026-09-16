import type { Meta, StoryObj } from '@storybook/react'
import { NestedSafeIntro } from './index'

const meta = {
  title: 'Components/NestedSafes/NestedSafeIntro',
  component: NestedSafeIntro,
  parameters: {
    componentSubtitle: 'Intro screen prompting the user to review and select Nested Safes',
  },
  args: {
    onReviewClick: () => {},
  },
  decorators: [
    (Story) => (
      <div className="max-w-[400px]">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof NestedSafeIntro>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
