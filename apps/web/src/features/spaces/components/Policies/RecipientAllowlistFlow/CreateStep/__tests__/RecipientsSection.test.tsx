import { faker } from '@faker-js/faker'
import { EditModeProvider } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/EditFlow/EditModeContext'
import { checksumAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { renderWithUserEvent, screen, within } from '@/tests/test-utils'
import { ContactSource, useMergedAddressBooks, type ExtendedContact } from '@/hooks/useAllAddressBooks'
import useNameResolver from '@/components/common/AddressInput/useNameResolver'
import { useChain } from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import {
  RECIPIENT_DUPLICATE_ERROR,
  RECIPIENT_IS_SAFE_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import {
  createDefaultAllowlistValues,
  type AllowlistFormRecipient,
  type RecipientAllowlistFormValues,
} from '../../types'
import RecipientsSection from '../RecipientsSection'

jest.mock('@/hooks/useAllAddressBooks', () => ({
  ContactSource: { space: 'space', local: 'local' },
  useMergedAddressBooks: jest.fn(),
}))

jest.mock('@/components/common/AddressInput/useNameResolver', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [], loading: false, loaded: true, error: undefined })),
  useChain: jest.fn(),
  useCurrentChain: jest.fn(),
  useHasFeature: jest.fn(() => false),
}))

const CHAIN_ID = '11155111'
const OTHER_CHAIN_ID = '1'
const PLACEHOLDER = 'Search contacts or paste an address'
const SAFE_ADDRESS = checksumAddress(faker.finance.ethereumAddress())

const address = () => checksumAddress(faker.finance.ethereumAddress())

const contact = (name: string, source: ContactSource, chainIds = [CHAIN_ID]): ExtendedContact => ({
  name,
  address: address(),
  chainIds,
  tagIds: [],
  createdBy: '',
  createdByUserId: 0,
  lastUpdatedBy: '',
  lastUpdatedByUserId: 0,
  createdAt: '',
  updatedAt: '',
  source,
})

const ALICE = contact('Alice', ContactSource.space)
const BOB = contact('Bob', ContactSource.local)
const OTHER_CHAIN = contact('Carol', ContactSource.space, [OTHER_CHAIN_ID])
const SAFE_CONTACT = { ...contact('Treasury', ContactSource.local), address: SAFE_ADDRESS }
const DUPLICATE = address()
const ENS_NAME = `${faker.internet.domainWord()}.eth`
const CHAIN = chainBuilder().with({ chainId: CHAIN_ID, shortName: 'sep', chainName: 'Sepolia' }).build()

type NameResolution = ReturnType<typeof useNameResolver>

const resolveEnsName = (resolution: Partial<NameResolution>) =>
  jest
    .mocked(useNameResolver)
    .mockImplementation((value) =>
      value === ENS_NAME
        ? { address: undefined, name: undefined, resolving: false, ...resolution }
        : { address: undefined, name: undefined, resolving: false },
    )

const mockBooks = (list: ExtendedContact[]) =>
  jest.mocked(useMergedAddressBooks).mockReturnValue({
    list,
    get: (target: string) => list.find((entry) => sameAddress(entry.address, target)),
    has: (target: string) => list.some((entry) => sameAddress(entry.address, target)),
    getFromSpace: () => undefined,
    getFromLocal: () => undefined,
  })

const renderSection = ({
  recipients = [],
  hasAccount = true,
  isEditMode = false,
}: { recipients?: AllowlistFormRecipient[]; hasAccount?: boolean; isEditMode?: boolean } = {}) => {
  const values: RecipientAllowlistFormValues = { ...createDefaultAllowlistValues(), recipients }
  const onChange = jest.fn()
  const section = (
    <RecipientsSection
      values={values}
      onChange={onChange}
      safeAddress={hasAccount ? SAFE_ADDRESS : undefined}
      chainId={hasAccount ? CHAIN_ID : undefined}
    />
  )
  const rendered = renderWithUserEvent(isEditMode ? <EditModeProvider>{section}</EditModeProvider> : section)
  return { ...rendered, values, onChange }
}

const search = () => screen.getByRole('combobox', { name: PLACEHOLDER })

describe('RecipientsSection', () => {
  beforeEach(() => {
    mockBooks([ALICE, BOB, OTHER_CHAIN, SAFE_CONTACT])
    jest.mocked(useChain).mockReturnValue(CHAIN)
    resolveEnsName({})
  })

  it('should, when creating, show the copy and no recipient chips', () => {
    renderSection()

    expect(screen.getByText('Who can receive funds')).toBeInTheDocument()
    expect(screen.getByText('Only transfers to the recipients selected below will be allowed.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Allow / })).not.toBeInTheDocument()
  })

  it("should, when the search field is focused, list the contacts on the Safe's chain under their address book", async () => {
    const { user } = renderSection()

    await user.click(search())

    expect(within(screen.getByRole('group', { name: /Contacts of/ })).getByRole('option')).toHaveTextContent(
      `Alice${ALICE.address}`,
    )
    expect(within(screen.getByRole('group', { name: /Local contacts/ })).getByRole('option')).toHaveTextContent(
      `Bob${BOB.address}`,
    )
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('should, when a contact is picked, add it with its address book name', async () => {
    const { user, onChange, values } = renderSection()

    await user.click(search())
    await user.click(screen.getByRole('option', { name: /Bob/ }))

    expect(onChange).toHaveBeenCalledWith({
      ...values,
      recipients: [{ address: BOB.address, name: 'Bob', fromAddressBook: true }],
    })
  })

  it('should, when an unknown address is pasted, offer it as a new recipient and add it checksummed', async () => {
    const pasted = address()
    const { user, onChange, values } = renderSection()

    await user.click(search())
    await user.paste(pasted.toLowerCase())
    await user.click(screen.getByRole('option', { name: /New recipient/ }))

    expect(onChange).toHaveBeenCalledWith({ ...values, recipients: [{ address: pasted }] })
    expect(search()).toHaveValue('')
  })

  it("should, when a contact's address is pasted, offer the contact", async () => {
    const { user, onChange, values } = renderSection()

    await user.click(search())
    await user.paste(ALICE.address)

    expect(screen.getAllByRole('option')).toHaveLength(1)

    await user.click(screen.getByRole('option', { name: /Alice/ }))

    expect(onChange).toHaveBeenCalledWith({
      ...values,
      recipients: [{ address: ALICE.address, name: 'Alice', fromAddressBook: true }],
    })
  })

  it.each([
    ["the Safe's own address", () => SAFE_ADDRESS, [], RECIPIENT_IS_SAFE_ERROR],
    [
      'an address already listed',
      () => DUPLICATE,
      [{ address: DUPLICATE }] as AllowlistFormRecipient[],
      RECIPIENT_DUPLICATE_ERROR,
    ],
  ])('should, when %s is pasted, show its error instead of an option', async (_, pasted, recipients, error) => {
    const { user } = renderSection({ recipients })

    await user.click(search())
    await user.paste(pasted())

    expect(screen.getByRole('alert')).toHaveTextContent(error)
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it("should, when an ENS name resolves on the Safe's chain, offer its address and add it under the name", async () => {
    const resolved = address()
    resolveEnsName({ address: resolved.toLowerCase(), name: ENS_NAME })
    const { user, onChange, values } = renderSection()

    await user.click(search())
    await user.type(search(), ENS_NAME)

    expect(useNameResolver).toHaveBeenLastCalledWith(ENS_NAME, CHAIN)
    expect(screen.getByRole('option')).toHaveTextContent(`${ENS_NAME}${resolved}`)

    await user.click(screen.getByRole('option', { name: new RegExp(ENS_NAME) }))

    expect(onChange).toHaveBeenCalledWith({ ...values, recipients: [{ address: resolved, name: ENS_NAME }] })
  })

  it("should, when an ENS name doesn't resolve, show why instead of an option", async () => {
    resolveEnsName({ resolverError: new Error('ENS name not available on Sepolia') })
    const { user } = renderSection()

    await user.click(search())
    await user.type(search(), ENS_NAME)

    expect(screen.getByRole('alert')).toHaveTextContent('ENS name not available on Sepolia')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('should, while an ENS name is looked up, show the loading rows', async () => {
    resolveEnsName({ resolving: true })
    const { user } = renderSection()

    await user.click(search())
    await user.type(search(), ENS_NAME)

    expect(screen.getByTestId('search-picker-loading')).toBeInTheDocument()
  })

  it('should, when an ENS name resolves to the Safe itself, show its error instead of an option', async () => {
    resolveEnsName({ address: SAFE_ADDRESS, name: ENS_NAME })
    mockBooks([ALICE, BOB])
    const { user } = renderSection()

    await user.click(search())
    await user.type(search(), ENS_NAME)

    expect(screen.getByRole('alert')).toHaveTextContent(RECIPIENT_IS_SAFE_ERROR)
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('should, when creating, show a recipient chip named from the address book, or as new, with its short address', () => {
    const unknown = address()
    renderSection({ recipients: [{ address: ALICE.address }, { address: unknown }] })

    expect(screen.getByRole('button', { name: 'Allow Alice' })).toHaveTextContent(
      `Alice${ALICE.address.slice(0, 6)}...${ALICE.address.slice(-4)}`,
    )
    expect(screen.getByRole('button', { name: `Allow ${shortenAddress(unknown)}` })).toHaveTextContent('New recipient')
  })

  it('should, when editing, name a live recipient without a name by its short address instead of as new', () => {
    const unknown = address()
    renderSection({ recipients: [{ address: unknown }], isEditMode: true })

    const chip = screen.getByRole('button', { name: `Allow ${shortenAddress(unknown)}` })
    expect(chip).toHaveTextContent(shortenAddress(unknown))
    expect(chip).not.toHaveTextContent('New recipient')
  })

  it('should, when a recipient chip is clicked, remove the recipient', async () => {
    const kept = { address: address(), name: 'Dave' }
    const { user, onChange, values } = renderSection({ recipients: [{ address: ALICE.address }, kept] })

    await user.click(screen.getByRole('button', { name: 'Allow Alice' }))

    expect(onChange).toHaveBeenCalledWith({ ...values, recipients: [kept] })
  })

  it('should, when no Safe is picked, disable the search field', () => {
    renderSection({ hasAccount: false })

    expect(search()).toBeDisabled()
  })
})
