import { faker } from '@faker-js/faker'
import userEvent from '@testing-library/user-event'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import * as spacesRTK from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { MixpanelEventParams, trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { getStoreInstance } from '@/store'
import { selectNotifications } from '@/store/notificationsSlice'
import { Builder } from '@/tests/Builder'
import { render, screen, waitFor } from '@/tests/test-utils'
import ImportWorkspaceCsv from '../ImportWorkspaceCsv'

const SPACE_ID = '7'

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => SPACE_ID,
  useWorkspaceAddressBookLabel: () => 'the Workspace address book',
}))
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [{ chainId: '1' } as Chain, { chainId: '100' } as Chain] }),
  useHasFeature: () => false,
  useCurrentChain: () => undefined,
}))
jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const upsert = jest.fn()
jest
  .spyOn(spacesRTK, 'useAddressBooksUpsertAddressBookItemsV1Mutation')
  .mockReturnValue([upsert, { reset: jest.fn() }] as unknown as ReturnType<
    typeof spacesRTK.useAddressBooksUpsertAddressBookItemsV1Mutation
  >)

const itemBuilder = () =>
  Builder.new<SpaceAddressBookItemDto>().with({
    name: faker.person.fullName(),
    address: checksumAddress(faker.finance.ethereumAddress()),
    chainIds: ['1'],
    createdBy: faker.internet.email(),
    createdByUserId: faker.number.int(),
    lastUpdatedBy: faker.internet.email(),
    lastUpdatedByUserId: faker.number.int(),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
  })

const newAddress = () => checksumAddress(faker.finance.ethereumAddress())

const csvFile = (rows: string[]) =>
  new File([['address,name,chainId', ...rows].join('\n')], 'contacts.csv', { type: 'text/csv' })

const openAndUpload = async (items: SpaceAddressBookItemDto[], rows: string[]) => {
  const user = userEvent.setup()
  render(<ImportWorkspaceCsv items={items} />)
  await user.click(screen.getByRole('button', { name: 'Import' }))
  await user.upload(document.body.querySelector('input[type="file"]') as HTMLInputElement, csvFile(rows))
  return user
}

const importMessages = () =>
  selectNotifications(getStoreInstance().getState())
    .filter((notification) => notification.groupKey === 'import-contacts-success')
    .map((notification) => notification.message)

describe('ImportWorkspaceCsv', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    upsert.mockResolvedValue({ data: [] })
  })

  it('sends new contacts and the chains a saved contact gains, in one request', async () => {
    const saved = itemBuilder()
      .with({ chainIds: ['1'] })
      .build()
    const address = newAddress()

    const user = await openAndUpload(
      [saved],
      [`${saved.address},Renamed,100`, `${address},Treasury,1`, `${address},Treasury,100`],
    )
    await waitFor(() => expect(screen.getByTestId('import-btn')).toBeEnabled())
    await user.click(screen.getByTestId('import-btn'))

    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1))
    expect(upsert).toHaveBeenCalledWith({
      spaceId: SPACE_ID,
      upsertAddressBookItemsDto: {
        items: [
          { address: saved.address, name: saved.name, chainIds: ['1', '100'] },
          { address, name: 'Treasury', chainIds: ['1', '100'] },
        ],
      },
    })
  })

  it('closes, confirms and tracks the new and updated counts after a successful import', async () => {
    const saved = itemBuilder()
      .with({ chainIds: ['1'] })
      .build()

    const user = await openAndUpload([saved], [`${saved.address},${saved.name},100`, `${newAddress()},Treasury,1`])
    await waitFor(() => expect(screen.getByTestId('import-btn')).toBeEnabled())
    await user.click(screen.getByTestId('import-btn'))

    await waitFor(() => expect(screen.queryByText('Import address book')).not.toBeInTheDocument())
    expect(importMessages()).toEqual([expect.stringMatching(/^2 contacts imported to the Workspace address book/)])
    expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.IMPORT_ADDRESS_BOOK_SUBMIT, {
      [MixpanelEventParams.ENTRY_COUNT]: 1,
      [MixpanelEventParams.UPDATED_COUNT]: 1,
    })
  })

  it('shows the gateway error and keeps the dialog open', async () => {
    const message = 'This Workspace only allows a maximum of 500 Address Book Items. You can only add up to 0 more.'
    upsert.mockResolvedValue({ error: { status: 400, data: { message } } })

    const user = await openAndUpload([], [`${newAddress()},Treasury,1`])
    await waitFor(() => expect(screen.getByTestId('import-btn')).toBeEnabled())
    await user.click(screen.getByTestId('import-btn'))

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(screen.getByText('Import address book')).toBeInTheDocument()
    expect(screen.getByTestId('import-btn')).toBeEnabled()
  })

  it('blocks a file with a row on an unsupported chain', async () => {
    await openAndUpload([], [`${newAddress()},Treasury,1`, `${newAddress()},Payroll,999`])

    expect(await screen.findByText('Row 3: chain 999 is not supported')).toBeInTheDocument()
    expect(screen.getByTestId('import-btn')).toBeDisabled()
  })

  it('blocks a file whose contacts are all saved already', async () => {
    const saved = itemBuilder()
      .with({ chainIds: ['1', '100'] })
      .build()

    await openAndUpload([saved], [`${saved.address},${saved.name},100`])

    expect(await screen.findByText('Every contact in this file is already in the address book')).toBeInTheDocument()
    expect(screen.getByTestId('import-btn')).toBeDisabled()
  })
})
