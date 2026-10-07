import { useContext, useEffect, useState, type ReactElement } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse, type RequestHandler } from 'msw'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useStore } from 'react-redux'
import { JsonRpcProvider, ZeroAddress } from 'ethers'
import { EthSafeTransaction } from '@safe-global/protocol-kit'
import type { SafeTransactionDataPartial } from '@safe-global/types-kit'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { TxModalContext, TxModalProvider } from '@/components/tx-flow'
import ConfirmTxFlow from '@/components/tx-flow/flows/ConfirmTx'
import NewTxFlow from '@/components/tx-flow/flows/NewTx'
import PageLayout from '@/components/common/PageLayout'
import { setSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { setWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { setStoreInstance } from '@/store'
import {
  createMockPendingTransactions,
  createMockStory,
  createMockTransactionDetails,
  getFixtureData,
} from '@/stories/mocks'
import { safenetChainsPage, safenetCheck, safenetRpcHandler, type Vote } from './safenetChainMocks'

const { safeData } = getFixtureData('efSafe')
const SAFE = safeData.address.value
const SAFE_TX_HASH = `0x${'abc1'.repeat(16)}`
const TX_ID = `multisig_${SAFE}_${SAFE_TX_HASH}`
const SUBMITTED_AT = Date.now() - 5 * 60_000
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDC_LOGO = `https://safe-transaction-assets.safe.global/tokens/logos/${USDC}.png`
const CONFIRM_RECIPIENT = '0x1234567890123456789012345678901234567890'
const NEW_RECIPIENT = '0x000000000000000000000000000000000000dEaD'
const MAINNET_RPC = 'https://story-rpc.safe.global/1'

/** The queued USDC transfer from the default mocks, keyed by a real safeTxHash. */
const txSummary = (() => {
  const row = createMockPendingTransactions(safeData).results.find(
    (item) => item.type === 'TRANSACTION' && item.transaction.id.endsWith('abc1'),
  )
  if (!row || row.type !== 'TRANSACTION') throw new Error('USDC transfer missing from the queue mocks')
  return { ...row.transaction, id: TX_ID, timestamp: SUBMITTED_AT } as unknown as Transaction
})()

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  features: { safenetChecks: true },
  shadcn: true,
  store: {
    addedSafes: { [safeData.chainId]: { [SAFE]: { owners: safeData.owners, threshold: safeData.threshold } } },
    addressBook: { [safeData.chainId]: { [CONFIRM_RECIPIENT]: 'vitalik.eth', [NEW_RECIPIENT]: 'Treasury' } },
  },
})

// --- Network ------------------------------------------------------------------------------

/**
 * Without the Tenderly env vars Storybook hides the simulation row, yet Safe Shield still counts it
 * ("3 of 4 checks passed"), so the chain drops TX_SIMULATION to keep header and rows consistent.
 */
const chainsHandler = (() => {
  const page = safenetChainsPage()
  const results = page.results.map((chain) => ({
    ...chain,
    features: chain.features.filter((feature) => feature !== FEATURES.TX_SIMULATION),
  }))
  return http.get(/\/v2\/chains$/, () => HttpResponse.json({ ...page, results }))
})()

const txDetailsHandler = http.get(/\/v1\/chains\/\d+\/transactions\/[^/]+$/, () => {
  const details = createMockTransactionDetails(safeData, TX_ID)
  return HttpResponse.json({
    ...details,
    detailedExecutionInfo: { ...details.detailedExecutionInfo, safeTxHash: SAFE_TX_HASH, submittedAt: SUBMITTED_AT },
  })
})

const ok = (type: string, title: string) => ({ severity: 'OK', type, title, description: title })

const recipientResult = {
  isSafe: false,
  RECIPIENT_INTERACTION: [ok('RECURRING_RECIPIENT', 'Recurring recipient')],
  RECIPIENT_ACTIVITY: [],
}

/** Safe Shield's CGW analyses, all settled with no findings and the transfer's USDC outflow. */
const safeShieldHandlers = (usdcOut: string): RequestHandler[] => [
  http.get(/\/v1\/chains\/\d+\/security\/0x[a-fA-F0-9]+\/recipient\/0x[a-fA-F0-9]+$/, () =>
    HttpResponse.json(recipientResult),
  ),
  http.post(/\/v1\/chains\/\d+\/security\/0x[a-fA-F0-9]+\/counterparty-analysis$/, () =>
    HttpResponse.json({
      recipient: { [CONFIRM_RECIPIENT]: recipientResult, [NEW_RECIPIENT]: recipientResult },
      contract: {
        [USDC]: {
          name: 'USD Coin',
          logoUrl: USDC_LOGO,
          CONTRACT_VERIFICATION: [ok('VERIFIED', 'Verified contract')],
          CONTRACT_INTERACTION: [ok('KNOWN_CONTRACT', 'Known contract')],
        },
      },
      deadlock: {},
    }),
  ),
  http.post(/\/v1\/chains\/\d+\/security\/0x[a-fA-F0-9]+\/threat-analysis$/, () =>
    HttpResponse.json({
      THREAT: [ok('NO_THREAT', 'No threat detected')],
      BALANCE_CHANGE: [
        {
          asset: { type: 'ERC20', symbol: 'USDC', address: USDC, logo_url: USDC_LOGO },
          in: [],
          out: [{ value: usdcOut }],
        },
      ],
    }),
  ),
]

type RpcRequest = { id: number; method: string }

/** Mainnet reads the flow makes outside the Safe SDK (Hypernative guard, address activity). */
const mainnetRpcHandler = http.post(MAINNET_RPC, async ({ request }) => {
  const results: Record<string, string> = { eth_chainId: '0x1', eth_getTransactionCount: '0x64', eth_getCode: '0x' }
  const answer = ({ id, method }: RpcRequest) => ({ jsonrpc: '2.0', id, result: results[method] ?? '0x' })
  const body = (await request.json()) as RpcRequest | RpcRequest[]
  return HttpResponse.json(Array.isArray(body) ? body.map(answer) : answer(body))
})

const handlers = (logs: ReturnType<typeof safenetCheck.submitted>, usdcOut: string) => [
  chainsHandler,
  txDetailsHandler,
  safenetRpcHandler(logs),
  mainnetRpcHandler,
  ...safeShieldHandlers(usdcOut),
  ...setup.parameters.msw.handlers,
]

// --- Page ---------------------------------------------------------------------------------

/**
 * The story mocks install an empty Safe SDK, so building the SafeTx would throw.
 * This one builds plain SafeTxs offline; nothing is signed or sent.
 */
const storySafeSdk = {
  createTransaction: async ({ transactions: [tx] }: { transactions: SafeTransactionDataPartial[] }) =>
    new EthSafeTransaction({
      operation: 0,
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      gasToken: ZeroAddress,
      refundReceiver: ZeroAddress,
      nonce: safeData.nonce,
      ...tx,
    } as ConstructorParameters<typeof EthSafeTransaction>[0]),
  getTransactionHash: async () => SAFE_TX_HASH,
  getAddress: async () => SAFE,
  getContractVersion: () => safeData.version ?? '1.4.1',
  getOwners: async () => safeData.owners.map((owner) => owner.value),
  getThreshold: async () => safeData.threshold,
  getNonce: async () => safeData.nonce,
}

type Args = { flow: 'confirm' | 'new' }

const OpenFlow = ({ flow }: Args): null => {
  const { setTxFlow } = useContext(TxModalContext)
  useEffect(() => {
    setTxFlow(flow === 'confirm' ? <ConfirmTxFlow txSummary={txSummary} /> : <NewTxFlow />, undefined, false)
  }, [flow, setTxFlow])
  return null
}

/** The app frame (topbar, sidebar) with the flow open in the real tx dialog, as on prod. */
const TxFlowPage = ({ flow }: Args): ReactElement | null => {
  const store = useStore()
  const [ready, setReady] = useState(false)

  // MockSDKProvider's mount effect runs after ours, so swap the app-level handles in on the next tick.
  useEffect(() => {
    const timer = setTimeout(() => {
      // tx-sender reads tx details and nonces through the store handle _app.tsx normally sets.
      setStoreInstance(store as never)
      setSafeSDK(storySafeSdk as never)
      setWeb3ReadOnly(new JsonRpcProvider(MAINNET_RPC, 1, { staticNetwork: true }))
      setReady(true)
    })
    return () => {
      clearTimeout(timer)
      setWeb3ReadOnly(undefined)
    }
  }, [store])

  if (!ready) return null

  return (
    // Cancels the 24px padding of the story's `layout: 'none'` wrapper.
    <div className="-m-6">
      <TxModalProvider>
        <PageLayout pathname="/transactions/queue">
          <div />
        </PageLayout>
        <OpenFlow flow={flow} />
      </TxModalProvider>
    </div>
  )
}

/** Waits for the Safenet section, then drops the dialog's open-time focus ring so the capture is clean. */
const settle = async () => {
  await waitFor(() => expect(document.querySelector('[data-testid^="safenet-"]')).not.toBeNull(), { timeout: 25_000 })
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
}

const meta = {
  title: 'Pages/Safenet/Transaction flow',
  component: TxFlowPage,
  decorators: [setup.decorator],
  args: { flow: 'confirm' },
  parameters: {
    layout: 'fullscreen',
    ...setup.parameters,
    // Chain reads resolve after mount and the Safenet section fades in.
    visualTest: { disable: true },
  },
  play: settle,
} satisfies Meta<typeof TxFlowPage>

export default meta
type Story = StoryObj<typeof meta>

const spec = { safeTxHash: SAFE_TX_HASH, safe: SAFE, chainId: '1', timestampMs: SUBMITTED_AT }

const confirm = (logs: ReturnType<typeof safenetCheck.submitted>): Story => ({
  args: { flow: 'confirm' },
  parameters: { msw: { handlers: handlers(logs, '4018.86') } },
})

const malicious = (votes: Vote[]) => confirm(safenetCheck.malicious(spec, votes))

export const ConfirmSimulating = confirm(safenetCheck.inProgress(spec))
export const ConfirmNoIssuesFound = confirm(safenetCheck.benign(spec))
/** Sentinels disagree on the rule. */
export const ConfirmRiskDetected = malicious(['R-4.5', 'R-4.5', 'R-4.4', 'R-4.5'])
/** A split vote with no ruling before the deadline. */
export const ConfirmCheckFailed = confirm(safenetCheck.timedOut(spec, [null, 'R-4.3']))

/** Review step of a new USDC transfer: Copilot shows the Safenet pre-check note for a multisig Safe. */
export const NewTransactionReview: Story = {
  args: { flow: 'new' },
  parameters: { msw: { handlers: handlers([], '1') } },
  play: async () => {
    // The flow renders in a portaled dialog, outside the story canvas.
    const page = within(document.body)

    await userEvent.click(await page.findByRole('button', { name: 'Send tokens' }, { timeout: 15_000 }))

    const tokenSelector = within(await page.findByTestId('token-selector'))
    await userEvent.click(await tokenSelector.findByRole('combobox'))
    const options = await page.findAllByRole('option')
    await userEvent.click(options.find((option) => option.textContent?.trim().startsWith('USDC')) ?? options[0])

    const recipient = await page.findByRole('combobox', { name: /Recipient address/ })
    await userEvent.type(recipient, NEW_RECIPIENT)
    await userEvent.type(page.getByTestId('token-amount-field'), '1')

    const nextButton = page.getByRole('button', { name: 'Next' })
    await waitFor(() => expect(nextButton).toBeEnabled())
    await userEvent.click(nextButton)

    await page.findByRole('heading', { name: 'Confirm transaction' })
    await settle()
  },
}
