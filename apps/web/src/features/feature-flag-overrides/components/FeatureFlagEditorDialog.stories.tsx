import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { StoreDecorator } from '@/stories/storeDecorator'
import { chainFixtures } from '../../../../../../config/test/msw/fixtures'
import { FeatureFlagEditorDialog } from './FeatureFlagEditorDialog'

const meta = {
  title: 'FeatureFlags/FeatureFlagEditorDialog',
  component: FeatureFlagEditorDialog,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    msw: {
      // Real chain config fixtures so rows show a realistic mix of global/off/per-chain scopes.
      handlers: [http.get(/\/v2\/chains$/, () => HttpResponse.json(chainFixtures.all))],
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FeatureFlagEditorDialog>

export default meta
type Story = StoryObj<typeof meta>

export const WithOverrides: Story = {
  loaders: [mswLoader],
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{ featureFlagOverrides: { [FEATURES.EARN]: true, [FEATURES.BRIDGE]: false } }}>
        <Story />
      </StoreDecorator>
    ),
  ],
}

export const NoOverrides: Story = {
  loaders: [mswLoader],
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{ featureFlagOverrides: {} }}>
        <Story />
      </StoreDecorator>
    ),
  ],
}
