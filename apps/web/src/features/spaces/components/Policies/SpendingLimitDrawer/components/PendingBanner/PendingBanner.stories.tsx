import type { Meta, StoryObj } from '@storybook/react'
import { PENDING_BANNER_TITLE, executeLine, signAndExecuteLine } from '../../copy'
import PendingBanner from './PendingBanner'

const meta = {
  title: 'Features/Spaces/Policies/SpendingLimitDrawer/components/PendingBanner',
  component: PendingBanner,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-[400px]">{Story()}</div>],
} satisfies Meta<typeof PendingBanner>

export default meta
type Story = StoryObj<typeof PendingBanner>

export const Creation: Story = {
  args: { title: PENDING_BANNER_TITLE.create, line2: signAndExecuteLine('create') },
}

/** A queued removal leaves the limit enforced, so the copy inverts. */
export const Removal: Story = {
  args: { title: PENDING_BANNER_TITLE.remove, line2: signAndExecuteLine('remove') },
}

export const Update: Story = {
  args: { title: PENDING_BANNER_TITLE.update, line2: executeLine('update') },
}

/** A non-signer has nothing to do, so the banner states the fact and stops. */
export const TitleOnly: Story = {
  args: { title: PENDING_BANNER_TITLE.create },
}
