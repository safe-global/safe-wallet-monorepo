import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory, createChainData, createChainsPageData } from '@/stories/mocks'
import { createChainsPageDataV2 } from '@/stories/mocks/chains'
import { PendingStatus, PendingTxType, type PendingProcessingTx } from '@/store/pendingTxsSlice'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { safeFixtures } from '../../../../../../../config/test/msw/fixtures'
import SpeedUpMonitor from './index'

// SpeedUpMonitor only renders when the SPEED_UP_TX feature is enabled on the
// chain, the pending tx is PROCESSING, the connected wallet is the tx signer
// (an EOA), and the tx has been pending for more than 15 seconds.
const signerAddress = safeFixtures.efSafe.owners[0].value

const pendingTx: PendingProcessingTx = {
  chainId: safeFixtures.efSafe.chainId,
  safeAddress: safeFixtures.efSafe.address.value,
  nonce: 42,
  txHash: '0x4a8f9c2e6b1d3a5f7e9c0b2d4f6a8c1e3b5d7f9a0c2e4b6d8f0a1c3e5b7d9f1a',
  submittedAt: Date.now() - 5 * 60 * 1000,
  signerNonce: 7,
  signerAddress,
  gasLimit: '150000',
  status: PendingStatus.PROCESSING,
  txType: PendingTxType.SAFE_TX,
}

// The mainnet fixture does not include SPEED_UP_TX, so serve a chain config
// with the feature enabled. These handlers are registered before the default
// mock handlers so they win for the chain endpoints.
const chainData = createChainData()
chainData.features = [...chainData.features, FEATURES.SPEED_UP_TX]

const chainHandlers = [
  http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(chainData)),
  http.get(/\/v1\/chains$/, () => HttpResponse.json(createChainsPageData(chainData))),
  http.get(/\/v2\/chains$/, () => HttpResponse.json(createChainsPageDataV2(chainData))),
]

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'paper',
  shadcn: true,
})

const meta = {
  title: 'Features/Speedup/SpeedUpMonitor',
  component: SpeedUpMonitor,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
    msw: { handlers: [...chainHandlers, ...setup.handlers] },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SpeedUpMonitor>

export default meta
type Story = StoryObj<typeof meta>

// Warning alert shown next to a pending transaction in the queue.
// Note: the component appears after ~1 second (the pending-time counter ticks
// on a 1s interval before the threshold check passes).
export const AlertBox: Story = {
  loaders: [mswLoader],
  args: {
    txId: 'multisig_0x123_0xabc1',
    pendingTx,
    modalTrigger: 'alertBox',
  },
}

// Compact button variant used in tighter layouts (e.g. notification list).
export const AlertButton: Story = {
  loaders: [mswLoader],
  args: {
    txId: 'multisig_0x123_0xabc1',
    pendingTx,
    modalTrigger: 'alertButton',
  },
}
