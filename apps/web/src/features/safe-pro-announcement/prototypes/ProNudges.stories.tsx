import { faker } from '@faker-js/faker'
import { useEffect, useState, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import type { SafeTransaction } from '@safe-global/types-kit'
import { FullAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'
import { createMockStory } from '@/stories/mocks/createMockStory'
import { MOCK_SPACE_ID } from '@/stories/mocks/ids'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import Notifications from '@/components/common/Notifications'
import SponsoredTxsCounter from '@/components/tx/SponsoredTxsCounter'
// eslint-disable-next-line no-restricted-imports -- prototype: shows the real Safe Shield widget
import { SafeShieldDisplay } from '@/features/safe-shield/components/SafeShieldDisplay'
// eslint-disable-next-line no-restricted-imports -- prototype: uses the Plans story prices
import { PAID_PLANS } from '@/features/spaces/components/Plans/plans.storyData'
// eslint-disable-next-line no-restricted-imports -- prototype: builds tiers like the Plans page
import { buildPlanTiers } from '@/features/spaces/components/Plans/planTiers'
import { ENTERPRISE_TIER } from '@safe-global/views/features/spaces/components/Plans/planCatalog'
import { TryProModal } from './TryProModal'
import { TRY_PRO_REASONS } from './tryPro'

faker.seed(456)

const TIERS = buildPlanTiers(PAID_PLANS).filter((tier) => tier.id !== ENTERPRISE_TIER.id)

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  authenticated: true,
  features: { safePro: true },
  pathname: '/transactions/queue',
  query: { spaceId: MOCK_SPACE_ID },
  shadcn: true,
})

const contractCallTx = {
  data: { to: '0x00000000000000000000000000000000000000aa', value: '0', data: '0xa9059cbb', operation: 0 },
} as unknown as SafeTransaction

const Stage = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-[640px] items-start justify-center bg-background p-8">
    <div className="w-[420px]">{children}</div>
  </div>
)

/** Renders a nudge and opens the Try Safe Pro modal with the reason its prompt passes. */
const WithModal = ({ children }: { children: (open: (reason: string) => void) => ReactNode }) => {
  const [reason, setReason] = useState<string>()
  return (
    <>
      {children(setReason)}
      {reason && <TryProModal tiers={TIERS} reason={reason} onClose={() => setReason(undefined)} />}
    </>
  )
}

/** `onTryPro` must be stable: the toast is dispatched once. */
const CoSignersToast = ({ onTryPro }: { onTryPro: (reason: string) => void }) => {
  const dispatch = useAppDispatch()
  useEffect(() => {
    dispatch(
      showNotification({
        groupKey: 'co-signers-nudge',
        variant: 'success',
        title: 'Signed',
        message: '2 more signatures needed. With Safe Pro, your co-signers share one queue and get notified to sign.',
        link: { title: 'Try Safe Pro', onClick: () => onTryPro(TRY_PRO_REASONS.signing) },
        autoHideDuration: null,
      }),
    )
  }, [dispatch, onTryPro])
  return <Notifications />
}

const meta = {
  title: 'Prototypes/Free users: Safe Pro nudges',
  parameters: { layout: 'fullscreen', ...setup.parameters },
  decorators: [setup.decorator],
  tags: ['skip-visual-test'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** The modal any upgrade prompt opens in place, with the prompt's reason under the title. */
export const TryProModalFromAPrompt: Story = {
  render: () => <TryProModal tiers={TIERS} reason={TRY_PRO_REASONS.sponsored} onClose={() => {}} />,
}

/** A free user runs out of today's free transactions: the counter explains it and opens the modal. */
export const Nudge1SponsoredTransactionsRunOut: Story = {
  render: () => (
    <Stage>
      <WithModal>
        {(open) => (
          <div className="overflow-hidden rounded-lg border border-border">
            <SponsoredTxsCounter
              left={0}
              quota={5}
              resetsAt={null}
              isSubscription={false}
              isPro={false}
              onUpgrade={() => open(TRY_PRO_REASONS.sponsored)}
            />
          </div>
        )}
      </WithModal>
    </Stage>
  ),
}

/** After signing, the toast says who's still needed and offers the shared queue. */
export const Nudge2AfterSigning: Story = {
  render: () => (
    <Stage>
      <WithModal>{(open) => <CoSignersToast onTryPro={open} />}</WithModal>
    </Stage>
  ),
}

/** Safe Shield's locked checks get an Unlock button that opens the modal with that check's reason. */
export const Nudge3SafeShieldLockedChecks: Story = {
  render: () => (
    <Stage>
      <WithModal>
        {(open) => (
          <SafeShieldDisplay
            {...FullAnalysisBuilder.noThreat().build()}
            safeTx={contractCallTx}
            hasProFeatures={false}
            isSafePro
            onUnlockPro={(check) => open(TRY_PRO_REASONS[check])}
          />
        )}
      </WithModal>
    </Stage>
  ),
}
