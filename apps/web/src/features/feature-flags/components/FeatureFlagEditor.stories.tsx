import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { StoreDecorator } from '@/stories/storeDecorator'
import { chainFixtures } from '../../../../../../config/test/msw/fixtures'
import { FeatureFlagEditor } from './FeatureFlagEditor'

const meta = {
  title: 'FeatureFlags/FeatureFlagEditor',
  component: FeatureFlagEditor,
  loaders: [mswLoader],
  parameters: {
    layout: 'padded',
    msw: {
      // Real chain config fixtures so rows show a realistic mix of global/off/per-chain scopes.
      handlers: [http.get(/\/v2\/chains$/, () => HttpResponse.json(chainFixtures.all))],
    },
  },
  decorators: [
    (Story) => (
      <StoreDecorator
        initialState={{
          featureFlagOverrides: { [FEATURES.EARN]: true, [FEATURES.BRIDGE]: false },
        }}
      >
        <Story />
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof FeatureFlagEditor>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  loaders: [mswLoader],
}
