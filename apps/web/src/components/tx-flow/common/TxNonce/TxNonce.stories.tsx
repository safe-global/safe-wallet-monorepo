import type { Meta, StoryObj } from '@storybook/react'
import { useContext, useState } from 'react'
import { faker } from '@faker-js/faker'
import TxNonce from './index'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext, initialContext as initialTxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { StoreDecorator } from '@/stories/storeDecorator'
import { RouterDecorator } from '@/stories/routerDecorator'
import { createInitialState } from '@/stories/mocks/defaults'
import { safeFixtures } from '@safe-global/test/msw/fixtures'

// Seed faker for deterministic visual regression tests
faker.seed(789)

const RECOMMENDED_NONCE = 12

type HarnessProps = {
  /** `false` renders the plain-text nonce instead of the editable combobox. */
  canEdit?: boolean
  /** Context-level read-only, as set for a rejection flow. */
  isReadOnly?: boolean
}

/**
 * Wraps TxNonce in the two contexts it reads, holding `nonce` in local state so the popup can be
 * opened, an option picked, and the resulting value observed — the two regressions this component's
 * tests guard against both broke exactly that (crash on open, and typed value discarded on close).
 */
const NonceHarness = ({ canEdit = true, isReadOnly = false }: HarnessProps) => {
  const [nonce, setNonce] = useState<number | undefined>(RECOMMENDED_NONCE)
  // Read the context's own defaults rather than hand-rolling SafeTxContextParams, so this story
  // can't drift as fields are added to the provider.
  const defaults = useContext(SafeTxContext)

  const safeTxContext: SafeTxContextParams = {
    ...defaults,
    nonce,
    setNonce,
    recommendedNonce: RECOMMENDED_NONCE,
    isReadOnly,
  }

  return (
    <SafeTxContext.Provider value={safeTxContext}>
      <TxFlowContext.Provider value={initialTxFlowContext}>
        {/* Tall enough that the popup opens downward in a stable position for snapshots. */}
        <div className="flex min-h-[22rem] items-start justify-center p-4">
          <TxNonce canEdit={canEdit} />
        </div>
      </TxFlowContext.Provider>
    </SafeTxContext.Provider>
  )
}

const meta: Meta<typeof NonceHarness> = {
  title: 'Components/TxFlow/TxNonce',
  component: NonceHarness,
  parameters: { layout: 'centered' },
  decorators: [
    (Story, context) => (
      <StoreDecorator
        initialState={createInitialState({
          safeData: safeFixtures.efSafe,
          isDarkMode: context.globals?.theme === 'dark',
        })}
        context={context}
      >
        <RouterDecorator>
          <Story />
        </RouterDecorator>
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * The editable nonce field. Click it (or press ArrowDown) to open the preset list, which renders a
 * "Recommended nonce" group and — when the queue is non-empty — a "Replace existing" group.
 *
 * Each label sits inside its own `ComboboxGroup`: Base UI's `GroupLabel` throws without a `Group`
 * ancestor, which previously crashed the popup the moment it mounted.
 */
export const Editable: Story = {
  args: { canEdit: true },
}

/** Plain-text nonce, as rendered once a transaction carries signatures or in a rejection flow. */
export const ReadOnly: Story = {
  args: { canEdit: true, isReadOnly: true },
}
