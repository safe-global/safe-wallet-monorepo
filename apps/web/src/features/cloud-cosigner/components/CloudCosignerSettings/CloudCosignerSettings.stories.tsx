import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { CLOUD_COSIGNER_URL } from '../../constants'
import type { SafeCloudCosignerStatus } from '../../types'
import CloudCosignerSettings from '.'

const COSIGNER_ADDRESS = '0xC051Ec0000000000000000000000000000000001'

const statusHandler = (status: SafeCloudCosignerStatus) =>
  http.get(`${CLOUD_COSIGNER_URL}/v1/chains/:chainId/safes/:safeAddress/cloud-cosigner`, () =>
    HttpResponse.json(status),
  )

const setup = (status: SafeCloudCosignerStatus) =>
  createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'none',
    store: { featureFlagOverrides: { [FEATURES.CLOUD_COSIGNER]: true } },
    handlers: [
      statusHandler(status),
      http.put(
        `${CLOUD_COSIGNER_URL}/v1/chains/:chainId/safes/:safeAddress/cloud-cosigner/policy`,
        async ({ request }) => {
          const body = (await request.json()) as { policy: SafeCloudCosignerStatus['policy'] }
          return HttpResponse.json(body.policy)
        },
      ),
    ],
  })

const meta = {
  title: 'Features/CloudCosigner/CloudCosignerSettings',
  component: CloudCosignerSettings,
  loaders: [mswLoader],
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof CloudCosignerSettings>

export default meta
type Story = StoryObj<typeof meta>

export const NotEnabled: Story = (() => {
  const s = setup({
    cosignerAddress: COSIGNER_ADDRESS,
    isEnabled: false,
    policy: { valueThresholdUsd: 100000, reviewUnknownContracts: true, instructions: null },
    isDefaultPolicy: true,
  })
  return { parameters: { ...s.parameters }, decorators: [s.decorator] }
})()

export const DefaultPolicy: Story = (() => {
  const s = setup({
    cosignerAddress: COSIGNER_ADDRESS,
    isEnabled: true,
    policy: { valueThresholdUsd: 100000, reviewUnknownContracts: true, instructions: null },
    isDefaultPolicy: true,
  })
  return { parameters: { ...s.parameters }, decorators: [s.decorator] }
})()

export const CustomPolicy: Story = (() => {
  const s = setup({
    cosignerAddress: COSIGNER_ADDRESS,
    isEnabled: true,
    policy: {
      valueThresholdUsd: 25000,
      reviewUnknownContracts: false,
      instructions: 'Only approve payments to our listed vendors. Never approve unlimited token allowances.',
    },
    isDefaultPolicy: false,
  })
  return { parameters: { ...s.parameters }, decorators: [s.decorator] }
})()
