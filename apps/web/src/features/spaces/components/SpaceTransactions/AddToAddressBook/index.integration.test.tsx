import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import type {
  MembersDto,
  SpaceAddressBookDto,
  SpaceAddressBookItemDto,
  TransactionQueuedItem,
  UpsertAddressBookItemsDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { UserWithWallets } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { Table, TableBody } from '@safe-global/views/components/ui/table'
import { authSlice, SESSION_LIFETIME_MS, setAuthenticated } from '@/store/authSlice'
import { memberBuilder, memberUserBuilder } from '@/tests/builders/member'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { spaceAddressBookItemBuilder } from '@/tests/builders/space'
import { renderWithScenario } from '@/tests/scenario-utils'
import { fireEvent, screen, waitFor } from '@/tests/test-utils'
import SpaceQueueRow from '../SpaceQueueRow'
import { AddToAddressBookProvider } from '.'

jest.mock('../RowActionsMenu', () => ({ __esModule: true, default: () => null }))
jest.mock('../SignersTooltip', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/transactions/TxSummary/QueueActions', () => ({ __esModule: true, default: () => null }))

const ADDRESS_BOOK_URL = /\/v1\/spaces\/[^/]+\/address-book$/
const CHAIN_ID = '1'
const SPACE_ID = faker.string.uuid()
const ADMIN_USER_ID = 7
const RECIPIENT = checksumAddress(faker.finance.ethereumAddress())
const CONTACT_NAME = 'Payroll vendor'

const admin: UserWithWallets = { id: ADMIN_USER_ID, status: 1, wallets: [] }

const adminMembership: MembersDto = {
  members: [
    memberBuilder()
      .with({ role: 'ADMIN', user: memberUserBuilder().with({ id: ADMIN_USER_ID }).build() })
      .build(),
  ],
}

const transferToRecipient = (): TransactionQueuedItem => ({
  type: 'TRANSACTION',
  conflictType: 'None',
  transaction: safeTxSummaryBuilder()
    .with({
      timestamp: faker.date.past().getTime(),
      executionInfo: executionInfoBuilder().build(),
      txInfo: {
        type: 'Transfer',
        direction: 'OUTGOING',
        sender: { value: checksumAddress(faker.finance.ethereumAddress()) },
        recipient: { value: RECIPIENT },
        transferInfo: { type: 'NATIVE_COIN', value: '1' },
      } as TransactionInfo,
    })
    .build(),
})

const renderTwoRowsAsAdmin = () => {
  const saved: UpsertAddressBookItemsDto[] = []
  let contacts: SpaceAddressBookItemDto[] = []
  const addressBook = (): SpaceAddressBookDto => ({ spaceUuid: SPACE_ID, data: contacts, tags: [] })

  renderWithScenario(
    <AddToAddressBookProvider>
      <Table>
        <TableBody>
          <SpaceQueueRow item={transferToRecipient()} chainId={CHAIN_ID} status="waiting" />
          <SpaceQueueRow item={transferToRecipient()} chainId={CHAIN_ID} status="waiting" />
        </TableBody>
      </Table>
    </AddToAddressBookProvider>,
    'efSafe',
    {
      handlers: [
        http.get(/\/v1\/users$/, () => HttpResponse.json(admin)),
        http.get(/\/v1\/spaces\/[^/]+\/members$/, () => HttpResponse.json(adminMembership)),
        http.get(ADDRESS_BOOK_URL, () => HttpResponse.json(addressBook())),
        http.put(ADDRESS_BOOK_URL, async ({ request }) => {
          const body = (await request.json()) as UpsertAddressBookItemsDto
          saved.push(body)
          contacts = body.items.map((item) => spaceAddressBookItemBuilder().with(item).build())
          return HttpResponse.json(addressBook())
        }),
      ],
      routerProps: { query: { spaceId: SPACE_ID } },
      storeOverrides: { auth: authSlice.reducer(undefined, setAuthenticated(Date.now() + SESSION_LIFETIME_MS)) },
    },
  )
  return { saved }
}

const addActions = () => screen.queryAllByRole('button', { name: 'Add to address book' })

describe('adding an unnamed address to the address book from the queue', () => {
  it('names the address in every row once an admin saves it, without a reload', async () => {
    const { saved } = renderTwoRowsAsAdmin()
    await waitFor(() => expect(addActions()).toHaveLength(2))

    fireEvent.click(addActions()[0])
    fireEvent.change(await screen.findByLabelText(/^Name/), { target: { value: CONTACT_NAME } })
    const submit = screen.getByRole('button', { name: 'Add contact' })
    await waitFor(() => expect(submit).toBeEnabled())
    fireEvent.click(submit)

    await waitFor(() => expect(screen.getAllByText(CONTACT_NAME)).toHaveLength(2))
    expect(addActions()).toHaveLength(0)
    expect(saved).toEqual([{ items: [{ name: CONTACT_NAME, address: RECIPIENT, chainIds: [CHAIN_ID] }] }])
  })
})
