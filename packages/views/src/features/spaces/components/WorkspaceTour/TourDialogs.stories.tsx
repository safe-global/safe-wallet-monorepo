import type { Meta, StoryObj } from '@storybook/react'
import { UsersRound, WalletCards } from 'lucide-react'
import TourDoneDialog from './TourDoneDialog'
import TourWelcomeDialog from './TourWelcomeDialog'

const meta = {
  title: 'Features/Spaces/WorkspaceTour/TourDialogs',
  component: TourWelcomeDialog,
  parameters: { layout: 'fullscreen' },
  tags: ['skip-visual-test'],
  args: { onStart: () => {}, onSkip: () => {} },
} satisfies Meta<typeof TourWelcomeDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Welcome: Story = {}

export const Done: Story = {
  render: () => (
    <TourDoneDialog
      actions={[
        {
          icon: WalletCards,
          label: 'Add a Safe account',
          description: 'Bring in an existing Safe',
          onSelect: () => {},
        },
        { icon: UsersRound, label: 'Invite your team', description: 'Add your co-signers', onSelect: () => {} },
      ]}
      onBack={() => {}}
      onFinish={() => {}}
    />
  ),
}
