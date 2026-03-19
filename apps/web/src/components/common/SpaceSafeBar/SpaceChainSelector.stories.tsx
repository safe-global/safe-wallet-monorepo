import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import ChainSelectorBlock from '@/features/spaces/components/SafeSelectorDropdown/components/ChainSelectorBlock'

const deployedChains = {
  single: [{ chainId: '1', chainName: 'Ethereum', chainLogoUri: undefined, shortName: 'eth' }],
  multi: [
    { chainId: '1', chainName: 'Ethereum', chainLogoUri: undefined, shortName: 'eth' },
    { chainId: '137', chainName: 'Polygon', chainLogoUri: undefined, shortName: 'matic' },
    { chainId: '8453', chainName: 'Base', chainLogoUri: undefined, shortName: 'base' },
  ],
}

const availableChains = [
  { chainId: '42161', chainName: 'Arbitrum', chainLogoUri: undefined, shortName: 'arb1' },
  { chainId: '100', chainName: 'Gnosis Chain', chainLogoUri: undefined, shortName: 'gno' },
  { chainId: '11155111', chainName: 'Sepolia', chainLogoUri: undefined, shortName: 'sep' },
]

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
  layout: 'paper',
  shadcn: true,
})

/**
 * Visual stories for the SpaceChainSelector container + ChainSelectorBlock.
 * SpaceChainSelector itself is a thin hook wrapper — these stories document
 * the visual states directly via ChainSelectorBlock.
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
        availableChains={availableChains}
        selectedChainId="1"
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
        availableChains={availableChains}
        selectedChainId="1"
        onChainSelect={() => {}}
        onAddNetwork={() => {}}
      />
    </Wrapper>
  ),
}

export const NoAvailableChains: Story = {
  render: () => (
    <Wrapper>
      <ChainSelectorBlock
        deployedChains={deployedChains.multi}
        availableChains={[]}
        selectedChainId="1"
        onChainSelect={() => {}}
        onAddNetwork={() => {}}
      />
    </Wrapper>
  ),
}
