import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import ChainSelectorBlock from '@/features/spaces/components/SafeSelectorDropdown/components/ChainSelectorBlock'

const chains = {
  single: [{ chainId: '1', chainName: 'Ethereum', chainLogoUri: undefined, shortName: 'eth' }],
  multi: [
    { chainId: '1', chainName: 'Ethereum', chainLogoUri: undefined, shortName: 'eth' },
    { chainId: '137', chainName: 'Polygon', chainLogoUri: undefined, shortName: 'matic' },
    { chainId: '8453', chainName: 'Base', chainLogoUri: undefined, shortName: 'base' },
  ],
}

/**
 * Visual stories for the SpaceChainSelector container + ChainSelectorBlock.
 * SpaceChainSelector itself is a thin hook wrapper — these stories document
 * the two visual states (single-chain and multi-chain) directly.
 */
const meta = {
  title: 'Features/Spaces/SpaceChainSelector',
  parameters: { layout: 'centered' },
  decorators: [
    withMockProvider(),
    (Story) => (
      <div className="flex items-center gap-2 px-4 pt-4 pb-0">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="self-stretch flex items-stretch shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] rounded-lg bg-card">
    {children}
  </div>
)

export const SingleChain: Story = {
  render: () => (
    <Wrapper>
      <ChainSelectorBlock
        hasMultipleChains={false}
        chains={chains.single}
        selectedChainId="1"
        onChainSelect={() => {}}
      />
    </Wrapper>
  ),
}

export const MultiChain: Story = {
  render: () => (
    <Wrapper>
      <ChainSelectorBlock hasMultipleChains={true} chains={chains.multi} selectedChainId="1" onChainSelect={() => {}} />
    </Wrapper>
  ),
}
