import type { Meta, StoryObj } from '@storybook/react'
import { ArrowUpRight } from 'lucide-react'
import { withMockProvider } from '@/storybook/preview'
import { SharedDrawerHeader } from './SharedDrawerHeader'
import { PanelLinkRow, PanelRow, PanelSection } from './PanelBody'
import { PanelAlert } from './PanelAlert'
import { SignaturesFooter } from './SignaturesFooter'

const NADIA = '0x1f2e3d4c5b6a79880716253443526170819a2b3c'
const TOM = '0x7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b'
const PRIYA = '0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3'

const Panel = ({ footer }: { footer: 'yours' | 'others' | 'ready' }) => (
  <div className="flex h-[720px] w-[440px] flex-col gap-3 overflow-hidden rounded-3xl bg-muted shadow-xl">
    <SharedDrawerHeader
      media={{ kind: 'icon', icon: ArrowUpRight, title: 'Send 1,250 USDC', subtitle: '#42 · Operations · Ethereum' }}
      status={{
        label: footer === 'ready' ? 'Ready to execute' : 'Ready to sign',
        tone: footer === 'others' ? 'subtle' : 'success',
      }}
      onPrevious={() => {}}
      onNext={() => {}}
      hasNext
      position={{ index: 2, count: 12 }}
      onToggleFullScreen={() => {}}
      onClose={() => {}}
    />
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-4 pb-4">
      <PanelAlert tone="warning" title="Executes after #41" description="Earlier transactions must execute first." />
      <PanelSection title="Summary" collapsible>
        <PanelRow label="Network">Ethereum</PanelRow>
        <PanelRow label="Proposed">Oct 18, 2026 · 16:40</PanelRow>
      </PanelSection>
      <PanelSection title="Runs after" rightNode="1 earlier">
        <PanelLinkRow onClick={() => {}}>
          <span className="min-w-0 flex-1 truncate text-sm">#41 · Send 500 USDC</span>
        </PanelLinkRow>
      </PanelSection>
    </div>
    <SignaturesFooter
      signed={footer === 'ready' ? 2 : 1}
      required={2}
      rows={[
        { kind: 'created', name: 'Nadia', time: 'Oct 18, 16:40' },
        { kind: 'signed', name: 'Nadia', address: NADIA, time: 'Oct 18, 16:40' },
        footer === 'yours'
          ? { kind: 'needed', name: 'Tom', address: TOM, you: true }
          : footer === 'others'
            ? { kind: 'needed', name: 'Priya', address: PRIYA }
            : { kind: 'signed', name: 'Tom', address: TOM, time: 'Oct 19, 09:05', you: true },
      ]}
      open
      onNotify={() => {}}
      actions={{
        primary:
          footer === 'others'
            ? { label: 'Remind' }
            : { label: footer === 'ready' ? 'Review and execute' : 'Review and sign' },
        secondary: {
          label: 'More actions',
          items: [
            { label: 'Replace with a transfer', onClick: () => {} },
            { label: 'Reject', onClick: () => {} },
          ],
        },
      }}
    />
  </div>
)

const meta = {
  title: 'Features/Spaces/Pending queue prototype/Shared panel',
  component: Panel,
  decorators: [withMockProvider()],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Panel>
export default meta
type Story = StoryObj<typeof meta>

export const YourSignature: Story = { args: { footer: 'yours' } }
export const WaitingOnOthers: Story = { args: { footer: 'others' } }
export const ReadyToExecute: Story = { args: { footer: 'ready' } }
