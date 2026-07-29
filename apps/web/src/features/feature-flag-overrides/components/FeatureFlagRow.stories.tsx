import type { Meta, StoryObj } from '@storybook/react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { StoreDecorator } from '@/stories/storeDecorator'
import { chainFixtures } from '../../../../../../config/test/msw/fixtures'
import { FeatureFlagRow } from './FeatureFlagRow'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'

const chains = chainFixtures.all.results

const meta = {
  title: 'FeatureFlags/FeatureFlagRow',
  component: FeatureFlagRow,
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
} satisfies Meta<typeof FeatureFlagRow>

export default meta
type Story = StoryObj<typeof meta>

const notOverriddenRow: FeatureFlagRowData = {
  feature: FEATURES.EARN,
  chainScope: 'global',
  configValue: true,
  override: undefined,
  effective: true,
  matchesCurrentChain: false,
}

const overriddenDivergingRow: FeatureFlagRowData = {
  feature: FEATURES.BRIDGE,
  chainScope: chains,
  configValue: false,
  override: true,
  effective: true,
  matchesCurrentChain: false,
}

const overriddenMatchingRow: FeatureFlagRowData = {
  feature: FEATURES.RECOVERY,
  chainScope: 'off',
  configValue: false,
  override: false,
  effective: false,
  matchesCurrentChain: true,
}

export const NotOverridden: Story = {
  args: {
    row: notOverriddenRow,
  },
}

export const OverriddenDivergingFromConfig: Story = {
  args: {
    row: overriddenDivergingRow,
  },
}

export const OverriddenMatchingCurrentChain: Story = {
  args: {
    row: overriddenMatchingRow,
  },
}
