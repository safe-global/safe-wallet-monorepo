import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import type { Submission } from '@safe-global/store/gateway/AUTO_GENERATED/targeted-messages'
import { createMockStory } from '@/stories/mocks'
import { safeFixtures } from '../../../../../../../config/test/msw/fixtures'
import OutreachPopup from './index'

// OutreachPopup decides its own visibility: it opens when the connected
// wallet is a Safe signer, the submission lookup has resolved, the survey has
// not been completed, and the popup was not dismissed (localStorage) or
// snoozed (sessionStorage). The mock returns an uncompleted submission so the
// popup shows itself.
const submission: Submission = {
  outreachId: 2,
  targetedSafeId: 1,
  signerAddress: safeFixtures.efSafe.owners[0].value,
  completionDate: null,
}

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  shadcn: true,
  handlers: [
    http.get(
      /\/v1\/targeted-messaging\/outreaches\/\d+\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/signers\/0x[a-fA-F0-9]+\/submissions$/,
      () => HttpResponse.json(submission),
    ),
  ],
})

const meta = {
  title: 'Features/TargetedOutreach/OutreachPopup',
  component: OutreachPopup,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'fullscreen',
    ...setup.parameters,
  },
} satisfies Meta<typeof OutreachPopup>

export default meta
type Story = StoryObj<typeof meta>

// The survey invitation popup, fixed to the bottom-right corner of the app.
// If it does not appear, clear the `outreachPopup_v2` localStorage key (set
// when the popup is dismissed) and reload the story.
export const Default: Story = {
  loaders: [mswLoader],
}
