import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { fakerChecksummedAddress, renderWithUserEvent, screen } from '@/tests/test-utils'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { chainBuilder } from '@/tests/builders/chains'
import { getStoreInstance, type RootState } from '@/store'
import { initialState as initialSettings } from '@/store/settingsSlice'
import { useNestedSafesVisibility } from '@/hooks/useNestedSafesVisibility'
import { NestedSafesPopover } from '.'

const parent = extendedSafeInfoBuilder().build()
const mockParentChain = chainBuilder().with({ chainId: parent.chainId }).build()

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [] }),
  useHasFeature: () => true,
  useChain: () => mockParentChain,
  useCurrentChain: () => mockParentChain,
}))
jest.mock('@/hooks/useFilteredNestedSafes')
jest.mock('@/hooks/useOnceVisible', () => ({ __esModule: true, default: () => false }))

const mockUseFilteredNestedSafes = jest.requireMock('@/hooks/useFilteredNestedSafes')
  .useFilteredNestedSafes as jest.Mock

const parentKey = parent.address.value.toLowerCase()
const validSafes = Array.from({ length: 6 }, () => fakerChecksummedAddress())
const suspiciousSafes = Array.from({ length: 2 }, () => fakerChecksummedAddress())
const nestedSafes = [...validSafes, ...suspiciousSafes]

const curatedFirstValidSafe = {
  [parentKey]: {
    selectedAddresses: [validSafes[0].toLowerCase()],
    hasCompletedCuration: true,
    lastModified: Date.now(),
  },
}

const NestedSafesHarness = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const { allSafesWithStatus, visibleSafes, hasCompletedCuration, isLoading } = useNestedSafesVisibility(
    nestedSafes,
    parent.chainId,
  )

  return (
    <>
      <button onClick={(event) => setAnchorEl(event.currentTarget)}>Open nested Safes</button>
      <NestedSafesPopover
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        rawNestedSafes={nestedSafes}
        allSafesWithStatus={allSafesWithStatus}
        visibleSafes={visibleSafes}
        hasCompletedCuration={hasCompletedCuration}
        isLoading={isLoading}
      />
    </>
  )
}

const findRows = () => screen.findAllByTestId('safe-list-item')

const renderPopover = (curatedNestedSafes: RootState['settings']['curatedNestedSafes'] = {}) => {
  const initialReduxState = {
    safeInfo: { data: parent, loaded: true, loading: false },
    settings: { ...initialSettings, curatedNestedSafes },
  } as unknown as Partial<RootState>

  const { user } = renderWithUserEvent(<NestedSafesHarness />, { initialReduxState })
  const openPopover = () => user.click(screen.getByRole('button', { name: 'Open nested Safes' }))
  const clickTestId = (testId: string) => user.click(screen.getByTestId(testId))
  const toggleRow = async (index: number) => user.click((await findRows())[index])

  return { openPopover, clickTestId, toggleRow }
}

const storedSelection = () => getStoreInstance().getState().settings.curatedNestedSafes[parentKey]?.selectedAddresses

describe('NestedSafesPopover', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
    server.use(
      http.get(`${GATEWAY_URL}/v3/chains/:chainId/delegates`, () =>
        HttpResponse.json({ count: 0, next: null, previous: null, results: [] }),
      ),
      http.get(`${GATEWAY_URL}/v2/safes`, () => HttpResponse.json([])),
    )
    mockUseFilteredNestedSafes.mockReturnValue({
      validatedSafes: [
        ...validSafes.map((address) => ({ address, isValid: true })),
        ...suspiciousSafes.map((address) => ({ address, isValid: false })),
      ],
      isLoading: false,
      startFiltering: jest.fn(),
      hasStarted: true,
    })
  })

  it('opens on the intro screen until the owner has curated the nested Safes', async () => {
    const { openPopover } = renderPopover()

    await openPopover()

    expect(await screen.findByText('Select Nested Safes')).toBeVisible()
    expect(screen.getByTestId('review-nested-safes-button')).toBeVisible()
    expect(screen.getByTestId('modal-dialog-close-btn')).toBeVisible()
    expect(screen.queryByTestId('manage-nested-safes-button')).not.toBeInTheDocument()
  })

  it('shows the intro again when the popover is closed without curating', async () => {
    const { openPopover, clickTestId } = renderPopover()

    await openPopover()
    await clickTestId('modal-dialog-close-btn')
    await openPopover()

    expect(await screen.findByTestId('review-nested-safes-button')).toBeVisible()
  })

  it('lists every nested Safe unselected and flags the suspicious ones after review', async () => {
    const { openPopover, clickTestId } = renderPopover()

    await openPopover()
    await clickTestId('review-nested-safes-button')

    expect(await findRows()).toHaveLength(nestedSafes.length)
    expect(screen.getByText('0 safes selected')).toBeVisible()
    expect(screen.getAllByTestId('suspicious-safe-warning')).toHaveLength(suspiciousSafes.length)
    expect(screen.getByTestId('cancel-manage-nested-safes')).toBeVisible()
    expect(screen.getByTestId('save-manage-nested-safes')).toBeVisible()
  })

  it('shows only the confirmed Safes after the first selection is saved', async () => {
    const { openPopover, clickTestId, toggleRow } = renderPopover()

    await openPopover()
    await clickTestId('review-nested-safes-button')
    await toggleRow(0)
    expect(screen.getByText('1 safe selected')).toBeVisible()
    await clickTestId('save-manage-nested-safes')

    expect(await findRows()).toHaveLength(1)
    expect(screen.queryByTestId('suspicious-safe-warning')).not.toBeInTheDocument()
    expect(screen.getByTestId('manage-nested-safes-button')).toBeVisible()
    expect(storedSelection()).toEqual([validSafes[0].toLowerCase()])
  })

  it('shows how many nested Safes are hidden', async () => {
    const { openPopover } = renderPopover(curatedFirstValidSafe)

    await openPopover()

    expect(await screen.findByTestId('more-nested-safes-indicator')).toHaveTextContent('+7 more nested safes found')
  })

  it('opens manage mode from the hidden-count link', async () => {
    const { openPopover, clickTestId } = renderPopover(curatedFirstValidSafe)

    await openPopover()
    await clickTestId('more-nested-safes-indicator')

    expect(await findRows()).toHaveLength(nestedSafes.length)
    expect(screen.getByTestId('save-manage-nested-safes')).toBeVisible()
    expect(screen.getByTestId('cancel-manage-nested-safes')).toBeVisible()
  })

  it('keeps the saved selection when manage mode opens again', async () => {
    const { openPopover, clickTestId } = renderPopover(curatedFirstValidSafe)

    await openPopover()
    await clickTestId('manage-nested-safes-button')

    expect(await findRows()).toHaveLength(nestedSafes.length)
    expect(screen.getAllByTestId('suspicious-safe-warning')).toHaveLength(suspiciousSafes.length)
    expect(screen.getByText('1 safe selected')).toBeVisible()
  })

  it('discards unsaved toggles on cancel', async () => {
    const { openPopover, clickTestId, toggleRow } = renderPopover(curatedFirstValidSafe)

    await openPopover()
    await clickTestId('manage-nested-safes-button')
    await toggleRow(1)
    await clickTestId('cancel-manage-nested-safes')
    await openPopover()

    expect(await findRows()).toHaveLength(1)
    expect(storedSelection()).toEqual([validSafes[0].toLowerCase()])
  })

  it('adds newly selected Safes to the list on save', async () => {
    const { openPopover, clickTestId, toggleRow } = renderPopover(curatedFirstValidSafe)

    await openPopover()
    await clickTestId('manage-nested-safes-button')
    await toggleRow(1)
    expect(screen.getByText('2 safes selected')).toBeVisible()
    await clickTestId('save-manage-nested-safes')

    expect(await findRows()).toHaveLength(2)
  })

  it('opens on the curated list when a curation is already stored', async () => {
    const { openPopover } = renderPopover(curatedFirstValidSafe)

    await openPopover()

    expect(await findRows()).toHaveLength(1)
    expect(screen.queryByTestId('review-nested-safes-button')).not.toBeInTheDocument()
    expect(screen.getByTestId('manage-nested-safes-button')).toBeVisible()
  })
})
