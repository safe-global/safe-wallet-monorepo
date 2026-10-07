import type { Meta, StoryObj } from '@storybook/react'
import { faker } from '@faker-js/faker'
import { FullAnalysisBuilder, RecipientAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'
import { StoreDecorator } from '@/stories/storeDecorator'
import { RouterDecorator } from '@/stories/routerDecorator'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import { TxFlowContext, initialContext } from '@/components/tx-flow/TxFlowProvider'
import { SafeShieldProvider } from '@/features/safe-shield/SafeShieldContext'
// eslint-disable-next-line no-restricted-imports -- the story renders the real panel the prototype plugs into
import { SafeShieldDisplay } from '@/features/safe-shield/components/SafeShieldDisplay'
import { MOCK_DATA_NOTE } from '../__fixtures__/checkStates'
import type { SafenetScenario } from '../types'
import { clearCheckStarts } from '../checkStarts'
import { SafenetCardCaption } from './SafenetCardCaption'

faker.seed(456)

const SCENARIO_KEY = 'SAFE_v2__safenetPrototypeScenario'

const analysis = FullAnalysisBuilder.verifiedContract(faker.finance.ethereumAddress())
  .recipient(RecipientAnalysisBuilder.knownRecipient(faker.finance.ethereumAddress()).build())
  .threat(FullAnalysisBuilder.noThreat().build().threat)
  .build()

const TX_ID = `multisig_0x81e84a1e121Add6514170396E864033e087E6216_0x${'ab'.repeat(32)}`

type ScreenProps = {
  scenario: SafenetScenario
  /** How long ago the first signature started the check. */
  startedAgoMs?: number
  flow: { isCreation: boolean; willExecute: boolean; txId?: string }
}

const ConfirmScreen = ({ flow }: ScreenProps) => (
  <TxFlowContext.Provider value={{ ...initialContext, ...flow }}>
    <div className="flex items-start gap-6 bg-background p-6">
      <div className="w-[560px] shrink-0">
        <Typography variant="h3" className="mb-2">
          Confirm transaction
        </Typography>
        <TxCard>
          <Typography className="font-bold">Send tokens</Typography>
          <div className="grid grid-cols-[48px_1fr] gap-y-2 text-sm">
            <span className="text-muted-foreground">Send</span>
            <span>0.00001 ETH</span>
            <span className="text-muted-foreground">To</span>
            <span className="font-mono text-xs break-all">0x81e84a1e121Add6514170396E864033e087E6216</span>
          </div>
          <SafenetCardCaption />
          <TxCardActions>
            <Button variant="outline">Back</Button>
            <Button size="submit">{flow.willExecute ? 'Execute' : 'Sign'}</Button>
          </TxCardActions>
        </TxCard>
      </div>
      <div className="w-80 shrink-0 pt-10">
        <SafeShieldDisplay {...analysis} />
      </div>
    </div>
  </TxFlowContext.Provider>
)

const meta = {
  title: 'Features/SafenetChecks/Prototype/ConfirmScreen',
  component: ConfirmScreen,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `The real tx card chrome and Safe Shield panel with the Safenet prototype on, at the Sign or Execute step. The card body is a stand-in. ${MOCK_DATA_NOTE}`,
      },
    },
  },
  tags: ['skip-visual-test'],
  loaders: [
    async ({ args }) => {
      clearCheckStarts()
      window.localStorage.setItem(
        SCENARIO_KEY,
        JSON.stringify({ ...args.scenario, startedAtMs: Date.now() - (args.startedAgoMs ?? 17_000) }),
      )
      return {}
    },
  ],
  decorators: [
    (Story, context) => (
      <StoreDecorator initialState={{ featureFlagOverrides: { SAFENET_CHECKS_PROTOTYPE: true } }} context={context}>
        <RouterDecorator>
          <SafeShieldProvider>
            <Story />
          </SafeShieldProvider>
        </RouterDecorator>
      </StoreDecorator>
    ),
  ],
} satisfies Meta<typeof ConfirmScreen>

export default meta
type Story = StoryObj<typeof meta>

const baseScenario: SafenetScenario = {
  role: 'auto',
  outcome: 'no-issues',
  timing: 'about-60s',
  enhancedExecution: true,
}

/** New transaction: nobody has signed, so there is no check yet. */
export const FirstSignerBeforeSigning: Story = {
  args: { scenario: { ...baseScenario, role: 'first-signer' }, flow: { isCreation: true, willExecute: false } },
}

export const CoSignerChecking: Story = {
  args: { scenario: baseScenario, flow: { isCreation: false, willExecute: false, txId: TX_ID } },
}

/** The common case: the check finished before the second signer opened the transaction. */
export const SecondSignerCheckDone: Story = {
  args: {
    scenario: baseScenario,
    startedAgoMs: 10 * 60_000,
    flow: { isCreation: false, willExecute: false, txId: TX_ID },
  },
}

export const ExecuteChecking: Story = {
  args: { scenario: baseScenario, flow: { isCreation: false, willExecute: true, txId: TX_ID } },
}

export const ExecuteRiskDetected: Story = {
  args: {
    scenario: { ...baseScenario, outcome: 'risk', timing: 'instant' },
    flow: { isCreation: false, willExecute: true, txId: TX_ID },
  },
}
