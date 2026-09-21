import type { Meta, StoryObj } from '@storybook/react'
import { FormProvider, useForm } from 'react-hook-form'
import { faker } from '@faker-js/faker'
import AddressBookInput from './index'
import { StoreDecorator } from '@/stories/storeDecorator'
import { RouterDecorator } from '@/stories/routerDecorator'
import { createInitialState } from '@/stories/mocks/defaults'
import { safeFixtures } from '@safe-global/test/msw/fixtures'
import { DEFAULT_CHAIN_ID } from '@/config/constants'
import { checksumAddress } from '@safe-global/utils/utils/addresses'

// Seed faker for deterministic visual regression tests
faker.seed(654)

const FIELD_NAME = 'recipient'

// Keyed by the chain useChainId resolves to in Storybook (no URL chain, no wallet), so the
// contacts pass AddressBookInput's per-chain filter and actually appear in the list.
const contacts = {
  [checksumAddress(faker.finance.ethereumAddress())]: 'Alice',
  [checksumAddress(faker.finance.ethereumAddress())]: 'Bob',
  [checksumAddress(faker.finance.ethereumAddress())]: 'Treasury multisig',
}

type HarnessProps = {
  /** Starting value of the recipient field. */
  address?: string
  /** Renders the "add it to your address book" hint for unknown addresses. */
  canAdd?: boolean
}

/**
 * AddressBookInput reads its value from the surrounding react-hook-form context and its contacts
 * from the address-book slice. Click the field to open the suggestion list — Escape, an outside
 * click and moving focus away all dismiss it; only clicking an option sets the recipient.
 */
const RecipientHarness = ({ address = '', canAdd = false }: HarnessProps) => {
  const methods = useForm({ defaultValues: { [FIELD_NAME]: address }, mode: 'all' })

  return (
    <FormProvider {...methods}>
      {/* Tall enough that the suggestion list opens downward in a stable position for snapshots. */}
      <form className="min-h-[24rem] w-[28rem] p-4" onSubmit={methods.handleSubmit(() => {})}>
        <AddressBookInput name={FIELD_NAME} label="Recipient address" canAdd={canAdd} />
      </form>
    </FormProvider>
  )
}

const meta: Meta<typeof RecipientHarness> = {
  title: 'Components/Common/AddressBookInput',
  component: RecipientHarness,
  parameters: { layout: 'centered' },
  decorators: [
    (Story, context) => (
      <StoreDecorator
        initialState={{
          ...createInitialState({
            safeData: safeFixtures.efSafe,
            isDarkMode: context.globals?.theme === 'dark',
          }),
          addressBook: { [DEFAULT_CHAIN_ID]: contacts },
        }}
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

/** Empty field with saved contacts to suggest. Click it to open the grouped list. */
export const WithContacts: Story = {
  args: {},
}

/**
 * A valid address already entered — suggestions are suppressed, and with `canAdd` the
 * unknown-address hint offers to save it.
 */
export const UnknownAddress: Story = {
  args: { address: checksumAddress(faker.finance.ethereumAddress()), canAdd: true },
}
