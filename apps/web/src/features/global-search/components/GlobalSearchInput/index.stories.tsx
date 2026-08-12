import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import GlobalSearchInput from './index'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  shadcn: true,
})

const meta = {
  title: 'Features/GlobalSearch/GlobalSearchInput',
  component: GlobalSearchInput,
  loaders: [mswLoader],
  decorators: [defaultSetup.decorator],
  parameters: {
    layout: 'padded',
    ...defaultSetup.parameters,
  },
} satisfies Meta<typeof GlobalSearchInput>

export default meta

type Story = StoryObj<typeof meta>

/** The search trigger stretches to fill its container (w-full). */
export const Default: Story = {}

/** Constrained to a narrow width, as it appears in the app header. */
export const Constrained: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
}
