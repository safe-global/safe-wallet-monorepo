import type { Meta, StoryObj } from '@storybook/react'
import { SAFE_ADDRESSES } from '@safe-global/test/msw/fixtures'
import { createMockStory } from '@/stories/mocks'
import { ChainSelectorBlock } from '@/features/spaces'

const deployedChains = {
  single: [{ chainId: '1', chainName: 'Ethereum', chainLogoUri: undefined, shortName: 'eth' }],
  multi: [
    { chainId: '1', chainName: 'Ethereum', chainLogoUri: undefined, shortName: 'eth' },
    { chainId: '137', chainName: 'Polygon', chainLogoUri: undefined, shortName: 'matic' },
    { chainId: '8453', chainName: 'Base', chainLogoUri: undefined, shortName: 'base' },
  ],
}

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
  layout: 'paper',
  shadcn: true,
})

/**
 * Visual stories for the SpaceChainSelector container + ChainSelectorBlock.
 * SpaceChainSelector itself is a thin hook wrapper — these stories document
 * the visual states directly via ChainSelectorBlock. The "All networks" accordion
 * and its unavailable state are driven by `useAddNetworkState`, which runs
 * against the mocked scenario inside the Portal-rendered DropdownMenuContent.
 */
const meta = {
  title: 'Features/Spaces/SpaceChainSelector',
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
  <div className="inline-flex items-center shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] rounded-lg bg-card min-w-[64px] min-h-[68px]">
    {children}
  </div>
)

export const SingleChain: Story = {
  render: () => (
    <Wrapper>
      <ChainSelectorBlock
        deployedChains={deployedChains.single}
        selectedChainId="1"
        safeAddress={SAFE_ADDRESSES.efSafe.address}
        deployedChainIds={['1']}
        onChainSelect={() => {}}
        onAddNetwork={() => {}}
      />
    </Wrapper>
  ),
}

export const MultiChain: Story = {
  render: () => (
    <Wrapper>
      <ChainSelectorBlock
        deployedChains={deployedChains.multi}
        selectedChainId="1"
        safeAddress={SAFE_ADDRESSES.efSafe.address}
        deployedChainIds={['1', '137', '8453']}
        onChainSelect={() => {}}
        onAddNetwork={() => {}}
      />
    </Wrapper>
  ),
}
