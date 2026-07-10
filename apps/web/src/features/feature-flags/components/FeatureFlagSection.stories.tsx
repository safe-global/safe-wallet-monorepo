import type { Meta, StoryObj } from '@storybook/react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { StoreDecorator } from '@/stories/storeDecorator'
import { chainFixtures } from '../../../../../../config/test/msw/fixtures'
import { FeatureFlagSection } from './FeatureFlagSection'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'

const chains = chainFixtures.all.results

const meta = {
  title: 'FeatureFlags/FeatureFlagSection',
  component: FeatureFlagSection,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <StoreDecorator
        initialState={{
          chains: { data: chains, loading: false },
        }}
      >
        <Story />
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof FeatureFlagSection>

export default meta
type Story = StoryObj<typeof meta>

const overriddenRows: FeatureFlagRowData[] = [
  {
    feature: FEATURES.BRIDGE,
    chainScope: chains,
    configValue: false,
    override: true,
    effective: true,
    matchesCurrentChain: false,
  },
  {
    feature: FEATURES.RECOVERY,
    chainScope: 'off',
    configValue: false,
    override: false,
    effective: false,
    matchesCurrentChain: true,
  },
]

const restRows: FeatureFlagRowData[] = [
  {
    feature: FEATURES.EARN,
    chainScope: 'global',
    configValue: true,
    override: undefined,
    effective: true,
    matchesCurrentChain: false,
  },
  {
    feature: FEATURES.NATIVE_WALLETCONNECT,
    chainScope: 'global',
    configValue: true,
    override: undefined,
    effective: true,
    matchesCurrentChain: false,
  },
]

export const Overridden: Story = {
  args: {
    title: 'Overridden',
    rows: overriddenRows,
  },
}

export const AllFlags: Story = {
  args: {
    title: 'All flags',
    rows: restRows,
  },
}

export const Empty: Story = {
  args: {
    title: 'Overridden',
    rows: [],
  },
}
