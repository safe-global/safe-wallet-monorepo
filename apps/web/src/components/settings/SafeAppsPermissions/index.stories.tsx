import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import local from '@/services/local-storage/local'
import { FEATURES, PermissionStatus } from '@/components/safe-apps/types'
import SafeAppsPermissions from './index'

// Urls must match the safe-apps fixture exactly — the component resolves names by url.
const MANY_APP = 'https://curve.fi'
const FEW_APP = 'https://invoicing.request.network'

local.setItem('SafeApps__browserPermissions', {
  [MANY_APP]: FEATURES.map((feature) => ({ feature, status: PermissionStatus.GRANTED })),
  [FEW_APP]: [
    { feature: 'camera', status: PermissionStatus.GRANTED },
    { feature: 'microphone', status: PermissionStatus.DENIED },
  ],
})

const setup = createMockStory({ scenario: 'efSafe', wallet: 'disconnected', layout: 'fullPage' })

const meta = {
  title: 'Components/Settings/SafeAppsPermissions',
  component: SafeAppsPermissions,
  loaders: [mswLoader],
  parameters: {
    componentSubtitle: 'Per-app browser permission list under Settings → Safe Apps',
    ...setup.parameters,
  },
  decorators: [setup.decorator],
  tags: ['autodocs'],
} satisfies Meta<typeof SafeAppsPermissions>

export default meta
type Story = StoryObj<typeof meta>

// Two rows: a short list, and every feature a manifest can request.
export const Default: Story = { loaders: [mswLoader] }
