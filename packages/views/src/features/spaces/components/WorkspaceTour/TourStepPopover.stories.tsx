import type { Meta, StoryObj } from '@storybook/react'
import { ArrowRightLeft, Coins, LayoutGrid, Settings, TrendingUp } from 'lucide-react'
import TourStepPopover from './TourStepPopover'

const anchor = {
  getBoundingClientRect: () => ({ x: 40, y: 40, top: 40, left: 40, width: 320, height: 56, right: 360, bottom: 96 }),
}

const meta = {
  title: 'Features/Spaces/WorkspaceTour/TourStepPopover',
  component: TourStepPopover,
  parameters: { layout: 'fullscreen' },
  tags: ['skip-visual-test'],
  args: {
    anchor,
    placement: { side: 'bottom', align: 'start' },
    progress: { current: 1, total: 7 },
    content: { title: 'Your workspace', body: 'Switch between workspaces here.' },
    onBack: () => {},
    onNext: () => {},
    onClose: () => {},
  },
  render: (args) => (
    <div className="h-[600px]">
      <TourStepPopover {...args} />
    </div>
  ),
} satisfies Meta<typeof TourStepPopover>

export default meta
type Story = StoryObj<typeof meta>

export const BodyOnly: Story = {}

export const WithTip: Story = {
  args: {
    content: {
      title: 'Signed in as',
      body: 'Your Sign-In with Ethereum account. It sets which workspaces you see and your role.',
      tip: 'Signing in can’t approve transactions.',
    },
  },
}

export const WithInsideList: Story = {
  args: {
    progress: { current: 4, total: 7 },
    content: {
      title: 'Open a Safe to work inside it',
      body: 'The workspace is your overview. Everything for a single Safe lives inside that Safe:',
      inside: [
        { icon: Coins, label: 'Assets', description: 'Tokens and NFTs it holds' },
        { icon: ArrowRightLeft, label: 'Transactions', description: 'Send, sign and execute' },
        { icon: LayoutGrid, label: 'Apps', description: 'Connect dApps and build batches' },
        { icon: TrendingUp, label: 'DeFi', description: 'Positions across protocols' },
        { icon: Settings, label: 'Settings', description: 'Signers, threshold and modules' },
      ],
      tip: 'Click a Safe to open it. The sidebar then shows a way back to the workspace.',
    },
  },
}
