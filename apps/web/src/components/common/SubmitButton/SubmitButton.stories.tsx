import type { Meta, StoryObj } from '@storybook/react'
import SubmitButton from './index'

/**
 * SubmitButton — the canonical modal / flow / settings submit button.
 * Owns `size="submit"` + the loading → spinner swap so every submit button
 * is the same size and behaves the same while pending.
 */
const meta = {
  title: 'Components/Common/SubmitButton',
  component: SubmitButton,
  argTypes: {
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
  },
  args: { children: 'Create workspace' },
} satisfies Meta<typeof SubmitButton>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold">States</h3>
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton>Create workspace</SubmitButton>
          <SubmitButton loading>Create workspace</SubmitButton>
          <SubmitButton disabled>Create workspace</SubmitButton>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          The label swaps to a spinner while <code>loading</code> without the button resizing (the <code>submit</code>{' '}
          size reserves a stable min-width). <code>loading</code> also disables the button.
        </p>
      </div>
    </div>
  ),
}
