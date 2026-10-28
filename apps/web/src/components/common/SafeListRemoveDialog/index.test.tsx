import { render, screen, waitFor, fakerChecksummedAddress } from '@/tests/test-utils'
import { userEvent } from '@testing-library/user-event'
import { getStoreInstance } from '@/store'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { mockChainId } from '@/tests/mocks/hooks'
import { PendingSafeStatus, type UndeployedSafe } from '@safe-global/utils/features/counterfactual/store/types'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import { AppRoutes } from '@/config/routes'
import SafeListRemoveDialog from './index'

const mockPush = jest.fn()

jest.mock('next/router', () => ({
  ...jest.requireActual('next/router'),
  __esModule: true,
  default: {
    pathname: '/home',
    push: (...args: unknown[]) => mockPush(...args),
  },
}))

jest.mock('@/hooks/useChainId')

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const undeployedSafe = (owner: string): UndeployedSafe => ({
  status: { status: PendingSafeStatus.AWAITING_EXECUTION, type: PayMethod.PayLater },
  props: { safeAccountConfig: { owners: [owner], threshold: 1 } },
})

describe('SafeListRemoveDialog', () => {
  const owner = fakerChecksummedAddress()
  let address: string

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockPush.mockResolvedValue(true)
    mockChainId('1')
    address = fakerChecksummedAddress()
  })

  const renderDialog = (safeInfoAddress = fakerChecksummedAddress()) => {
    const handleClose = jest.fn()
    render(<SafeListRemoveDialog handleClose={handleClose} address={address} chainId="1" />, {
      initialReduxState: {
        safeInfo: {
          loading: false,
          loaded: true,
          data: extendedSafeInfoBuilder()
            .with({ address: { value: safeInfoAddress } })
            .build(),
        },
        undeployedSafes: { '1': { [address]: undeployedSafe(owner) }, '137': { [address]: undeployedSafe(owner) } },
        addedSafes: { '1': { [address]: { owners: [{ value: owner }], threshold: 1 } } },
        addressBook: { '1': { [address]: 'Treasury' }, '137': { [address]: 'Treasury' } },
      },
    })
    return handleClose
  }

  it('removes an undeployed Safe, its name and its pending activation on that network only', async () => {
    const handleClose = renderDialog()

    expect(screen.getByText('Treasury')).toBeInTheDocument()
    await userEvent.click(screen.getByTestId('delete-btn'))

    const state = getStoreInstance().getState()
    expect(state.undeployedSafes['1']).toBeUndefined()
    expect(state.undeployedSafes['137'][address]).toBeDefined()
    expect(state.addedSafes['1']?.[address]).toBeUndefined()
    expect(state.addressBook['1']?.[address]).toBeUndefined()
    expect(state.addressBook['137'][address]).toBe('Treasury')
    expect(handleClose).toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('queues the backend delete of the Safe when the user is not signed in', async () => {
    renderDialog()

    await userEvent.click(screen.getByTestId('delete-btn'))

    await waitFor(() => {
      expect(getStoreInstance().getState().pendingCfDeletes).toEqual([{ chainId: '1', address }])
    })
  })

  it('sends the user to the accounts page when the removed Safe is the one that is open', async () => {
    renderDialog(address)

    await userEvent.click(screen.getByTestId('delete-btn'))

    expect(mockPush).toHaveBeenCalledWith(AppRoutes.welcome.accounts)
    expect(getStoreInstance().getState().undeployedSafes['1']).toBeUndefined()
  })
})
