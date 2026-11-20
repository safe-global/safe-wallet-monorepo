import { faker } from '@faker-js/faker'
import { useEffect, type ContextType, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import type { SafeTransaction } from '@safe-global/types-kit'
import { FullAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'
import { Typography } from '@safe-global/views/components/ui/typography'
import { createMockStory } from '@/stories/mocks/createMockStory'
import { MOCK_SPACE_ID } from '@/stories/mocks/ids'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import Queue from '@/pages/transactions/queue'
import TxLayoutBase from '@/components/tx-flow/common/TxLayoutBase'
import { SafeShieldContext } from '@/features/safe-shield/public/hooks/useSafeShield'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import { ExecutionMethod, ExecutionMethodSelector } from '@/components/tx/ExecutionMethodSelector'
// eslint-disable-next-line no-restricted-imports -- prototype: uses the Plans story prices
import { PAID_PLANS } from '@/features/spaces/components/Plans/plans.storyData'
// eslint-disable-next-line no-restricted-imports -- prototype: builds tiers like the Plans page
import { _offersToTiers } from '@/features/spaces/components/Plans/planTiers'
import { TRY_PRO_REASONS, TryProProvider, useTryPro } from './tryPro'

faker.seed(456)

const TIERS = _offersToTiers(PAID_PLANS).filter((tier) => tier.billingCycle === 'month')

const WithTryPro = ({ children }: { children: ReactNode }) => (
  <TryProProvider tiers={TIERS} safeCount={3}>
    {children}
  </TryProProvider>
)

const flowSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  authenticated: true,
  features: { safePro: true },
  query: { spaceId: MOCK_SPACE_ID },
  shadcn: true,
})

const queueSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  authenticated: true,
  features: { safePro: true },
  layout: 'fullPage',
  pathname: '/transactions/queue',
  query: { spaceId: MOCK_SPACE_ID },
})

const contractCallTx = {
  data: { to: '0x00000000000000000000000000000000000000aa', value: '0', data: '0xa9059cbb', operation: 0 },
} as unknown as SafeTransaction

const freeUserShield: NonNullable<ContextType<typeof SafeShieldContext>> = {
  ...FullAnalysisBuilder.noThreat().build(),
  setRecipientAddresses: () => {},
  setPoisoningAddresses: () => {},
  setSafeTx: () => {},
  safeTx: contractCallTx,
  needsRiskConfirmation: false,
  isRiskConfirmed: false,
  setIsRiskConfirmed: () => {},
  safeAnalysis: null,
  addToTrustedList: () => {},
  hasProFeatures: false,
  isSafePro: true,
  isOffchainMessage: false,
}

const CoSignersToast = () => {
  const dispatch = useAppDispatch()
  const openTryPro = useTryPro()

  useEffect(() => {
    dispatch(
      showNotification({
        groupKey: 'co-signers-nudge',
        variant: 'success',
        title: 'Signed',
        message: '2 more signatures needed. With Safe Pro, your co-signers share one queue and get notified to sign.',
        link: { title: 'Try Safe Pro', onClick: () => openTryPro?.(TRY_PRO_REASONS.signing) },
        autoHideDuration: null,
      }),
    )
  }, [dispatch, openTryPro])

  return null
}

const meta = {
  title: 'Prototypes/Free users: Safe Pro nudges in the app',
  parameters: { layout: 'fullscreen' },
  tags: ['skip-visual-test'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/**
 * The real transaction chrome and Safe Shield around the real gas selector in its out-of-free-transactions
 * state. The rest of the review card is left out: the execute step needs a relayer the mocks don't have.
 */
export const Nudge1OutOfFreeTransactionsOnReview: Story = {
  parameters: flowSetup.parameters,
  decorators: [flowSetup.decorator],
  render: () => (
    <WithTryPro>
      <TxLayout title="Confirm transaction" subtitle="Execute">
        <div className="flex flex-col gap-4 rounded-b-xl bg-card p-6">
          <ExecutionMethodSelector
            executionMethod={ExecutionMethod.RELAY}
            setExecutionMethod={() => {}}
            offer={null}
            showsProUpsell
          />
        </div>
      </TxLayout>
    </WithTryPro>
  ),
}

/** The real Queue page after signing: the toast says who's still needed and offers the shared queue. */
export const Nudge2AfterSigningOnTheQueue: Story = {
  parameters: queueSetup.parameters,
  decorators: [queueSetup.decorator],
  render: () => (
    <WithTryPro>
      <Queue />
      <CoSignersToast />
    </WithTryPro>
  ),
}

/**
 * The real transaction chrome and Safe Shield widget on a contract call, with Safe Shield's analysis fed a
 * finished "no threat" result: the live checks don't resolve against the story mocks. Unlock opens Try Safe Pro.
 */
export const Nudge3SafeShieldOnReview: Story = {
  parameters: flowSetup.parameters,
  decorators: [flowSetup.decorator],
  render: () => (
    <WithTryPro>
      <SafeShieldContext.Provider value={freeUserShield}>
        <TxLayoutBase title="Confirm transaction" subtitle="Contract interaction" step={1} stepCount={2} progress={100}>
          <div className="rounded-b-xl bg-card p-6">
            <Typography variant="paragraph-small" color="muted">
              Interact with 0x0000…00aa
            </Typography>
          </div>
        </TxLayoutBase>
      </SafeShieldContext.Provider>
    </WithTryPro>
  ),
}
