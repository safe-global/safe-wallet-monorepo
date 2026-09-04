import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse, delay } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { fn } from 'storybook/test'
import { createMockStory } from '@/stories/mocks'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { CLOUD_COSIGNER_URL } from '../../constants'
import CloudCosignerOption from '.'

const COSIGNER_ADDRESS = '0xC051Ec0000000000000000000000000000000001'

const info = {
  address: COSIGNER_ADDRESS,
  defaultPolicy: { valueThresholdUsd: 100000, reviewUnknownContracts: true, instructions: null },
}

const infoHandler = http.get(`${CLOUD_COSIGNER_URL}/v1/cloud-cosigner`, () => HttpResponse.json(info))
const slowHandler = http.get(`${CLOUD_COSIGNER_URL}/v1/cloud-cosigner`, async () => {
  await delay('infinite')
  return HttpResponse.json(info)
})
const errorHandler = http.get(`${CLOUD_COSIGNER_URL}/v1/cloud-cosigner`, () =>
  HttpResponse.json({ message: 'unavailable' }, { status: 503 }),
)

const setup = (handler: typeof infoHandler) =>
  createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'paper',
    store: { featureFlagOverrides: { [FEATURES.CLOUD_COSIGNER]: true } },
    handlers: [handler],
  })

const Interactive = ({ initialChecked }: { initialChecked: boolean }) => {
  const [checked, setChecked] = useState(initialChecked)
  return <CloudCosignerOption checked={checked} onCheckedChange={setChecked} />
}

const meta = {
  title: 'Features/CloudCosigner/CloudCosignerOption',
  component: CloudCosignerOption,
  loaders: [mswLoader],
  // Every story renders the stateful wrapper below; these args only satisfy the component's props.
  args: { checked: false, onCheckedChange: fn() },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof CloudCosignerOption>

export default meta
type Story = StoryObj<typeof meta>

export const Unchecked: Story = (() => {
  const s = setup(infoHandler)
  return {
    parameters: { ...s.parameters },
    decorators: [s.decorator],
    render: () => <Interactive initialChecked={false} />,
  }
})()

export const Checked: Story = (() => {
  const s = setup(infoHandler)
  return {
    parameters: { ...s.parameters },
    decorators: [s.decorator],
    render: () => <Interactive initialChecked />,
  }
})()

/** The service call never resolves, so the skeleton stays visible. */
export const Loading: Story = (() => {
  const s = setup(slowHandler)
  return {
    parameters: { ...s.parameters },
    decorators: [s.decorator],
    tags: ['skip-visual-test'],
    render: () => <Interactive initialChecked={false} />,
  }
})()

export const ServiceUnavailable: Story = (() => {
  const s = setup(errorHandler)
  return {
    parameters: { ...s.parameters },
    decorators: [s.decorator],
    render: () => <Interactive initialChecked={false} />,
  }
})()

/** Feature flag off for the chain: the option renders nothing. */
export const FeatureDisabled: Story = (() => {
  const s = createMockStory({ scenario: 'efSafe', wallet: 'owner', layout: 'paper', handlers: [infoHandler] })
  return {
    parameters: { ...s.parameters },
    decorators: [s.decorator],
    render: () => <Interactive initialChecked={false} />,
  }
})()
