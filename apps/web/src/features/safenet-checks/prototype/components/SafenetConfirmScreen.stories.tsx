import type { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { faker } from '@faker-js/faker'
import { FullAnalysisBuilder, RecipientAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'
import { StoreDecorator } from '@/stories/storeDecorator'
import { RouterDecorator } from '@/stories/routerDecorator'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import { TxFlowContext, initialContext } from '@/components/tx-flow/TxFlowProvider'
import { SafeShieldProvider, useSafeShield } from '@/features/safe-shield/SafeShieldContext'
// eslint-disable-next-line no-restricted-imports -- the story renders the real panel the prototype plugs into
import { SafeShieldDisplay } from '@/features/safe-shield/components/SafeShieldDisplay'
import { MOCK_DATA_NOTE } from '../__fixtures__/checkStates'
import type { SafenetScenario } from '../types'
import type { SafenetFlowStep } from '../copy'
import { SafenetCardCaption } from './SafenetCardCaption'
import { SafenetTxRail } from './SafenetTxRail'

faker.seed(456)

const SCENARIO_KEY = 'SAFE_v2__safenetPrototypeScenario'

const analysis = FullAnalysisBuilder.verifiedContract(faker.finance.ethereumAddress())
  .recipient(RecipientAnalysisBuilder.knownRecipient(faker.finance.ethereumAddress()).build())
  .threat(FullAnalysisBuilder.noThreat().build().threat)
  .build()

const ShieldPanel = (props: ComponentProps<typeof SafeShieldDisplay>) => {
  const { safenetPhase } = useSafeShield()
  return <SafeShieldDisplay {...props} safenetPhase={safenetPhase} />
}

const PRIMARY_LABEL: Record<SafenetFlowStep, string> = { review: 'Continue', sign: 'Sign', execute: 'Execute' }

type ScreenProps = {
  scenario: SafenetScenario
  flow: { isCreation: boolean; willExecute: boolean; step: number; stepCount: number }
  cardStep: SafenetFlowStep
}

const ConfirmScreen = ({ flow, cardStep }: ScreenProps) => (
  <TxFlowContext.Provider value={{ ...initialContext, ...flow }}>
    <div className="flex items-start gap-6 bg-background p-6">
      <div className="pt-10">
        <SafenetTxRail step={flow.step} stepCount={flow.stepCount} />
      </div>
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
          <TxCardActions>
            <Button variant="outline">Back</Button>
            <Button size="submit">{PRIMARY_LABEL[cardStep]}</Button>
          </TxCardActions>
          <SafenetCardCaption step={cardStep} />
        </TxCard>
      </div>
      <div className="w-80 shrink-0 pt-10">
        <ShieldPanel {...analysis} />
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
        component: `The real rail, tx card chrome and Safe Shield panel with the Safenet prototype on. The card body is a stand-in. ${MOCK_DATA_NOTE}`,
      },
    },
  },
  tags: ['skip-visual-test'],
  loaders: [
    async ({ args }) => {
      window.localStorage.setItem(SCENARIO_KEY, JSON.stringify({ ...args.scenario, startedAtMs: Date.now() - 17_000 }))
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
  timing: 'never',
  enhancedExecution: true,
}

export const BeforeSigning: Story = {
  args: {
    scenario: baseScenario,
    flow: { isCreation: true, willExecute: false, step: 1, stepCount: 3 },
    cardStep: 'review',
  },
}

export const Checking: Story = {
  args: {
    scenario: baseScenario,
    flow: { isCreation: false, willExecute: false, step: 0, stepCount: 2 },
    cardStep: 'review',
  },
}

export const ExecuteChecking: Story = {
  args: {
    scenario: baseScenario,
    flow: { isCreation: false, willExecute: true, step: 1, stepCount: 2 },
    cardStep: 'execute',
  },
}

export const ExecuteRiskDetected: Story = {
  args: {
    scenario: { ...baseScenario, outcome: 'risk', timing: 'instant' },
    flow: { isCreation: false, willExecute: true, step: 1, stepCount: 2 },
    cardStep: 'execute',
  },
}

export const ExecuteNoIssues: Story = {
  args: {
    scenario: { ...baseScenario, timing: 'instant' },
    flow: { isCreation: false, willExecute: true, step: 1, stepCount: 2 },
    cardStep: 'execute',
  },
}
