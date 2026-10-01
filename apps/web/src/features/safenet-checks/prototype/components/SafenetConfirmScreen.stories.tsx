import type { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { faker } from '@faker-js/faker'
import { FullAnalysisBuilder, RecipientAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'
import { StoreDecorator } from '@/stories/storeDecorator'
import { RouterDecorator } from '@/stories/routerDecorator'
import TxStatusWidget from '@/components/tx-flow/common/TxStatusWidget'
import { SafeShieldProvider, useSafeShield } from '@/features/safe-shield/SafeShieldContext'
// eslint-disable-next-line no-restricted-imports -- the story renders the real panel the prototype plugs into
import { SafeShieldDisplay } from '@/features/safe-shield/components/SafeShieldDisplay'
import { MOCK_DATA_NOTE, STORY_NOW_MS, STORY_STATES } from '../__fixtures__/checkStates'
import type { SafenetScenario } from '../types'
import { SafenetExecuteStatusView } from './SafenetExecuteStatus'

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

type ScreenProps = {
  scenario: SafenetScenario
  execute: ComponentProps<typeof SafenetExecuteStatusView>
}

const ConfirmScreen = ({ execute }: ScreenProps) => (
  <div className="flex items-start gap-6 bg-background p-6">
    <div className="w-48 shrink-0">
      <TxStatusWidget />
    </div>
    <div className="w-[560px] shrink-0 rounded-lg bg-card p-6">
      <p className="text-lg font-bold">Send tokens</p>
      <p className="text-sm text-muted-foreground">0.00001 ETH to 0x81e8…6216</p>
      <SafenetExecuteStatusView {...execute} />
    </div>
    <div className="w-80 shrink-0">
      <ShieldPanel {...analysis} />
    </div>
  </div>
)

const meta = {
  title: 'Features/SafenetChecks/Prototype/ConfirmScreen',
  component: ConfirmScreen,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `The real tx flow stepper and Safe Shield panel with the Safenet prototype switched on. The centre card is a stand-in. ${MOCK_DATA_NOTE}`,
      },
    },
  },
  tags: ['skip-visual-test'],
  loaders: [
    async ({ args }) => {
      window.localStorage.setItem(SCENARIO_KEY, JSON.stringify({ ...args.scenario, startedAtMs: Date.now() }))
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
  role: 'co-signer',
  outcome: 'no-issues',
  timing: 'never',
  enhancedExecution: true,
}

export const Checking: Story = {
  args: {
    scenario: baseScenario,
    execute: { state: STORY_STATES.checking, nowMs: STORY_NOW_MS, onWait: () => {} },
  },
}

export const RiskDetected: Story = {
  args: {
    scenario: { ...baseScenario, outcome: 'risk', timing: 'instant' },
    execute: { state: STORY_STATES.risk, nowMs: STORY_NOW_MS },
  },
}

export const BeforeSigning: Story = {
  args: {
    scenario: { ...baseScenario, role: 'first-signer' },
    execute: { state: STORY_STATES['before-sign'], nowMs: STORY_NOW_MS },
  },
}
