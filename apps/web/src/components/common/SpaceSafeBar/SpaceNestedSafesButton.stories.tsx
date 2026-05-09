import type { Meta, StoryObj } from '@storybook/react'
import { GitMerge } from 'lucide-react'
import { createMockStory } from '@/stories/mocks'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
  layout: 'paper',
  shadcn: true,
})

/**
 * Visual stories for SpaceNestedSafesButton's inner presentation.
 * The actual component relies on multiple hooks (useSafeInfo, useHasFeature, etc.),
 * so these stories render the visual states directly.
 */
const meta = {
  title: 'Features/Spaces/SpaceNestedSafesButton',
  parameters: {
    layout: 'centered',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)] rounded-lg bg-card min-h-[68px]">
    {children}
  </div>
)

const Badge = ({ count }: { count: number }) => (
  <span className="absolute left-[13px] -top-[5px] flex size-[14px] items-center justify-center rounded-full bg-[rgba(18,255,128,0.1)] text-[10px] font-medium leading-none text-secondary-foreground">
    {count}
  </span>
)

const Button = ({ count }: { count?: number }) => (
  <Wrapper>
    <button className="relative flex items-center border-0 rounded-lg bg-transparent px-2 m-1 cursor-pointer hover:bg-muted/30 transition-colors h-full">
      <div className="relative flex items-center">
        <GitMerge className="size-5" />
        {count !== undefined && count > 0 && <Badge count={count} />}
      </div>
    </button>
  </Wrapper>
)

export const WithCount: Story = {
  render: () => <Button count={3} />,
}

export const WithSingleNested: Story = {
  render: () => <Button count={1} />,
}

export const NoNestedSafes: Story = {
  render: () => <Button />,
}

export const WithHighCount: Story = {
  render: () => <Button count={12} />,
}
