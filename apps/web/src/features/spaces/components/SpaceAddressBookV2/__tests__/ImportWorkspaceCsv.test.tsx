import { faker } from '@faker-js/faker'
import userEvent from '@testing-library/user-event'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import * as spacesRTK from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { SpaceAddressBookItemDto, SpaceAddressBookTagDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { ELEVATION_REQUIRED_ERROR } from '@/features/oidc-auth/utils/elevation'
import { MixpanelEventParams, trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { getStoreInstance } from '@/store'
import { selectNotifications } from '@/store/notificationsSlice'
import { spaceAddressBookItemBuilder, spaceAddressBookTagBuilder } from '@/tests/builders/space'
import { render, screen, waitFor } from '@/tests/test-utils'
import { RTK_QUERY_ERROR_MESSAGES } from '@/utils/rtkQuery'
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

const newAddress = () => checksumAddress(faker.finance.ethereumAddress())

const csvFile = (rows: string[], header = 'address,name,chainId') =>
  new File([[header, ...rows].join('\n')], 'contacts.csv', { type: 'text/csv' })

const openAndUpload = async (
  items: SpaceAddressBookItemDto[],
  rows: string[],
  { tags = [], header }: { tags?: SpaceAddressBookTagDto[]; header?: string } = {},
) => {
  const user = userEvent.setup()
  render(<ImportWorkspaceCsv items={items} tags={tags} />)
  await user.click(screen.getByRole('button', { name: 'Import' }))
  await user.upload(document.body.querySelector('input[type="file"]') as HTMLInputElement, csvFile(rows, header))
  return user
}

const importFile = async (user: ReturnType<typeof userEvent.setup>) => {
  await waitFor(() => expect(screen.getByTestId('import-btn')).toBeEnabled())
  await user.click(screen.getByTestId('import-btn'))
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
    const saved = spaceAddressBookItemBuilder()
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
    const saved = spaceAddressBookItemBuilder()
      .with({ chainIds: ['1'] })
      .build()

    const user = await openAndUpload([saved], [`${saved.address},${saved.name},100`, `${newAddress()},Treasury,1`])
    await waitFor(() => expect(screen.getByTestId('import-btn')).toBeEnabled())
    await user.click(screen.getByTestId('import-btn'))

    await waitFor(() => expect(screen.queryByText('Import address book')).not.toBeInTheDocument())
    expect(importMessages()).toEqual(['2 contacts imported to the Workspace address book across 2 networks'])
    expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.IMPORT_ADDRESS_BOOK_SUBMIT, {
      [MixpanelEventParams.ENTRY_COUNT]: 1,
      [MixpanelEventParams.UPDATED_COUNT]: 1,
      [MixpanelEventParams.WITH_TAGS]: false,
    })
  })

  it('merges the file tags into the saved ones and tracks the import as one with tags', async () => {
    const team = spaceAddressBookTagBuilder().with({ name: 'Team' }).build()
    const saved = spaceAddressBookItemBuilder()
      .with({ chainIds: ['1'], tagIds: [team.id] })
      .build()
    const address = newAddress()

    const user = await openAndUpload(
      [saved],
      [`${saved.address},${saved.name},1,Ops`, `${address},Treasury,1,Ops;Vendor`],
      { tags: [team], header: 'address,name,chainId,tags' },
    )
    await importFile(user)

    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1))
    expect(upsert).toHaveBeenCalledWith({
      spaceId: SPACE_ID,
      upsertAddressBookItemsDto: {
        items: [
          { address: saved.address, name: saved.name, chainIds: ['1'], tags: ['Team', 'Ops'] },
          { address, name: 'Treasury', chainIds: ['1'], tags: ['Ops', 'Vendor'] },
        ],
      },
    })
    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith(
        SPACE_EVENTS.IMPORT_ADDRESS_BOOK_SUBMIT,
        expect.objectContaining({ [MixpanelEventParams.WITH_TAGS]: true }),
      ),
    )
  })

  it('blocks a file with a tag the workspace rejects', async () => {
    await openAndUpload([], [`${newAddress()},Treasury,1,=Ops`], { header: 'address,name,chainId,tags' })

    expect(await screen.findByText('Row 2: Tags cannot start with =, +, - or @')).toBeInTheDocument()
    expect(screen.getByTestId('import-btn')).toBeDisabled()
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

  it('keeps the dialog and its file open, with no error, when the step-up is cancelled', async () => {
    upsert.mockResolvedValue({ error: { status: 403, data: { message: ELEVATION_REQUIRED_ERROR } } })

    const user = await openAndUpload([], [`${newAddress()},Treasury,1`])
    await importFile(user)

    await waitFor(() => expect(screen.getByTestId('import-btn')).toBeEnabled())
    expect(screen.getByText('Import address book')).toBeInTheDocument()
    expect(screen.getByTestId('summary-message')).toBeInTheDocument()
    expect(screen.queryByText(RTK_QUERY_ERROR_MESSAGES.generic)).not.toBeInTheDocument()
    expect(importMessages()).toEqual([])
  })

  it('counts no networks in the toast for a contact that only gains tags', async () => {
    const saved = spaceAddressBookItemBuilder()
      .with({ chainIds: ['1', '100'] })
      .build()

    const user = await openAndUpload([saved], [`${saved.address},${saved.name},1,Ops`], {
      header: 'address,name,chainId,tags',
    })
    await importFile(user)

    await waitFor(() => expect(importMessages()).toEqual(['1 contact imported to the Workspace address book']))
  })

  it('blocks a file with a row on an unsupported chain', async () => {
    await openAndUpload([], [`${newAddress()},Treasury,1`, `${newAddress()},Payroll,999`])

    expect(await screen.findByText('Row 3: chain 999 is not supported')).toBeInTheDocument()
    expect(screen.getByTestId('import-btn')).toBeDisabled()
  })

  it('blocks a file whose contacts are all saved already', async () => {
    const saved = spaceAddressBookItemBuilder()
      .with({ chainIds: ['1', '100'] })
      .build()

    await openAndUpload([saved], [`${saved.address},${saved.name},100`])

    expect(await screen.findByText('Every contact in this file is already in the address book')).toBeInTheDocument()
    expect(screen.getByTestId('import-btn')).toBeDisabled()
  })
})
