import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory, createChainData, createChainsPageData } from '@/stories/mocks'
import { createChainsPageDataV2 } from '@/stories/mocks/chains'
import { PendingStatus, PendingTxType, type PendingProcessingTx } from '@/store/pendingTxsSlice'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { safeFixtures } from '../../../../../../../config/test/msw/fixtures'
import SpeedUpModal from './index'

// SpeedUpModal renders its content only when the connected wallet is the
// signer of the pending transaction, so the pending tx uses the first efSafe
// owner (the address the 'owner' wallet preset connects with).
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
  shadcn: true,
})

const meta = {
  title: 'Features/Speedup/SpeedUpModal',
  component: SpeedUpModal,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'fullscreen',
    ...setup.parameters,
    msw: { handlers: [...chainHandlers, ...setup.handlers] },
  },
} satisfies Meta<typeof SpeedUpModal>

export default meta
type Story = StoryObj<typeof meta>

// The modal in its wallet-fallback variant: without a signed Safe transaction
// available (the story harness has no signer SDK), the modal instructs the
// user to use the speed-up option of their connected wallet. The variant with
// editable gas parameters requires a live signer and on-chain gas estimation.
export const Default: Story = {
  loaders: [mswLoader],
  args: {
    open: true,
    handleClose: () => {},
    pendingTx,
    txId: 'multisig_0x123_0xabc1',
    txHash: pendingTx.txHash,
    signerAddress,
    signerNonce: 7,
    gasLimit: '150000',
  },
}
