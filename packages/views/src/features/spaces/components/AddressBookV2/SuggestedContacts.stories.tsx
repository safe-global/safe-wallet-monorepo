import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import Identicon from '@safe-global/views/components/common/Identicon'
import TableCard from '@safe-global/views/components/common/TableCard'
import { Badge } from '@safe-global/views/components/ui/badge'
import { validateContactName } from '@/features/spaces/components/SpaceAddressBook/utils'
import NameContactsDialog from './NameContactsDialog'
import SuggestedContacts from './SuggestedContacts'
import { SUGGESTED_SIGNERS } from './mocks/fixtures'

const meta = {
  title: 'Features/Spaces/AddressBookV2/SuggestedContacts',
  component: SuggestedContacts,
  parameters: { layout: 'padded' },
  decorators: [(Story) => <TableCard>{Story()}</TableCard>],
  args: {
    suggestions: SUGGESTED_SIGNERS,
    canAdd: true,
    onAdd: fn(),
    renderAvatar: (address: string) => <Identicon address={address} size={24} />,
    getExplorerLink: (address: string) => ({
      href: `https://etherscan.io/address/${address}`,
      title: 'View on etherscan.io',
    }),
  },
} satisfies Meta<typeof SuggestedContacts>

export default meta
type Story = StoryObj<typeof meta>

export const Admin: Story = {}

/** A member sees the suggestions without checkboxes or add buttons; the app can supply a row action. */
export const Member: Story = {
  args: {
    canAdd: false,
    renderRowAction: () => <Badge variant="secondary">Ask an admin</Badge>,
  },
}

export const Empty: Story = { args: { suggestions: [] } }

export const Paginated: Story = { args: { pageSize: 2 } }

export const AddDialog: Story = {
  decorators: [],
  render: () => (
    <NameContactsDialog
      contacts={SUGGESTED_SIGNERS.slice(0, 2)}
      validateName={validateContactName}
      onConfirm={fn()}
      onClose={fn()}
    />
  ),
}

export const AddDialogError: Story = {
  decorators: [],
  render: () => (
    <NameContactsDialog
      contacts={SUGGESTED_SIGNERS.slice(0, 1)}
      validateName={() => undefined}
      onConfirm={fn()}
      onClose={fn()}
      error="Could not add the contacts. Try again."
    />
  ),
}

const SINGLE_CONTACT = {
  address: SUGGESTED_SIGNERS[0].address,
  chains: SUGGESTED_SIGNERS[0].chains,
  suggestedName: SUGGESTED_SIGNERS[0].suggestedName,
}

/** A member requests one contact, from Suggested or Local contacts. */
export const RequestDialog: Story = {
  decorators: [],
  render: () => (
    <NameContactsDialog
      contacts={[SINGLE_CONTACT]}
      validateName={validateContactName}
      onConfirm={fn()}
      onClose={fn()}
      title="Request to add contact"
      description="An admin has to approve the request before the contact appears in the Workspace address book. Leave the name empty to keep it."
      confirmLabel="Request to add"
    />
  ),
}

/** An admin adds one Local contact. */
export const AddLocalContactDialog: Story = {
  decorators: [],
  render: () => (
    <NameContactsDialog
      contacts={[SINGLE_CONTACT]}
      validateName={validateContactName}
      onConfirm={fn()}
      onClose={fn()}
      description="Everyone in the Workspace will see this name. Leave it empty to keep your local name."
    />
  ),
}

const LONG = ' with a name long enough to need truncating'

/** Long names and Safe names in a 1000px container, where the Contact column used to run over Chains. */
export const LongTextNarrow: Story = {
  decorators: [(Story) => <div className="w-[1000px]">{Story()}</div>],
  args: {
    suggestions: SUGGESTED_SIGNERS.map((item) => ({
      ...item,
      suggestedName: item.suggestedName + LONG,
      reason: { ...item.reason, safes: item.reason.safes.map((safe) => safe + LONG) },
    })),
  },
}
