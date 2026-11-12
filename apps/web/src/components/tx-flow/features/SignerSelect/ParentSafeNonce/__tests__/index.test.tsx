import { http, HttpResponse } from 'msw'
import { userEvent } from '@testing-library/user-event'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { act, fakerChecksummedAddress, render, screen, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { getStoreInstance } from '@/store'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import {
  multisigExecutionInfoBuilder,
  multisigTransactionBuilder,
  queuedTransactionItem,
} from '@/tests/builders/queuedTransaction'
import { WalletContext, type WalletContextType } from '@/components/common/WalletProvider'
import ParentSafeNonce from '..'

jest.mock('@/hooks/useSafeInfo')

const mockUseSafeInfo = jest.requireMock('@/hooks/useSafeInfo').default as jest.Mock

const CHAIN_ID = '1'
const CURRENT_NONCE = 10
const QUEUED_NONCE = 11
const RECOMMENDED_NONCE = 12

const queuedPage = (nonce: number): QueuedItemPage => ({
  next: null,
  previous: null,
  results: [
    queuedTransactionItem(
      multisigTransactionBuilder()
        .with({ executionInfo: multisigExecutionInfoBuilder().with({ nonce }).build() })
        .build(),
    ),
  ],
})

const unavailable = () => HttpResponse.json({ message: 'Unavailable' }, { status: 500 })

const mockParentSafeApi = (parentSafeAddress: string, { noncesFail = false, queueFails = false } = {}) => {
  const safePath = `${GATEWAY_URL}/v1/chains/${CHAIN_ID}/safes/${parentSafeAddress}`
  server.use(
    http.get(`${safePath}/nonces`, () =>
      noncesFail
        ? unavailable()
        : HttpResponse.json({ currentNonce: CURRENT_NONCE, recommendedNonce: RECOMMENDED_NONCE }),
    ),
    http.get(`${safePath}/transactions/queued`, () =>
      queueFails ? unavailable() : HttpResponse.json(queuedPage(QUEUED_NONCE)),
    ),
  )
}

const renderParentSafeNonce = (parentSafeAddress: string) => {
  const setParentSafeNonce = jest.fn()
  const clearParentSafeNonce = jest.fn()
  const walletContext = { setParentSafeNonce, clearParentSafeNonce } as unknown as WalletContextType
  const view = render(
    <WalletContext.Provider value={walletContext}>
      <ParentSafeNonce parentSafeAddress={parentSafeAddress} />
    </WalletContext.Provider>,
  )
  return { ...view, setParentSafeNonce, clearParentSafeNonce }
}

const getLoadedNonceInput = async () => {
  const input = await screen.findByRole('combobox')
  await waitFor(() => expect(input).toHaveValue(String(RECOMMENDED_NONCE)))
  return input
}

// RTK batches store notifications, so a refetch result reaches the component after the dispatch resolves
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)))

const typeNonce = async (input: HTMLElement, nonce: number) => {
  const user = userEvent.setup()
  await user.clear(input)
  await user.type(input, String(nonce))
}

describe('ParentSafeNonce', () => {
  const parentSafeAddress = fakerChecksummedAddress()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeInfo.mockReturnValue({ safe: extendedSafeInfoBuilder().with({ chainId: CHAIN_ID }).build() })
  })

  it('shows the parent Safe recommended nonce without pinning it for the signer', async () => {
    mockParentSafeApi(parentSafeAddress)
    const { setParentSafeNonce } = renderParentSafeNonce(parentSafeAddress)

    await getLoadedNonceInput()

    expect(setParentSafeNonce).not.toHaveBeenCalled()
  })

  it('offers the parent Safe queued txs as nonces to replace', async () => {
    const user = userEvent.setup()
    mockParentSafeApi(parentSafeAddress)
    renderParentSafeNonce(parentSafeAddress)

    await user.click(await getLoadedNonceInput())

    expect(await screen.findByText('Replace existing')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: new RegExp(`^${QUEUED_NONCE} -`) })).toBeInTheDocument()
  })

  it('hands the signer a nonce the user types', async () => {
    mockParentSafeApi(parentSafeAddress)
    const { setParentSafeNonce } = renderParentSafeNonce(parentSafeAddress)

    await typeNonce(await getLoadedNonceInput(), QUEUED_NONCE)

    await waitFor(() => expect(setParentSafeNonce).toHaveBeenLastCalledWith(QUEUED_NONCE))
  })

  it('stops pinning a nonce when the user resets to the recommended one', async () => {
    const user = userEvent.setup()
    mockParentSafeApi(parentSafeAddress)
    const { setParentSafeNonce, clearParentSafeNonce } = renderParentSafeNonce(parentSafeAddress)
    const input = await getLoadedNonceInput()
    await typeNonce(input, QUEUED_NONCE)
    await waitFor(() => expect(setParentSafeNonce).toHaveBeenLastCalledWith(QUEUED_NONCE))

    await user.click(screen.getByRole('button', { name: 'Reset to recommended nonce' }))

    await waitFor(() => expect(clearParentSafeNonce).toHaveBeenCalled())
    expect(input).toHaveValue(String(RECOMMENDED_NONCE))
    expect(setParentSafeNonce).not.toHaveBeenCalledWith(RECOMMENDED_NONCE)
  })

  it('rejects a nonce below the parent Safe on-chain nonce', async () => {
    mockParentSafeApi(parentSafeAddress)
    const { setParentSafeNonce } = renderParentSafeNonce(parentSafeAddress)
    const input = await getLoadedNonceInput()

    await typeNonce(input, CURRENT_NONCE - 1)

    await waitFor(() => expect(input).toHaveAccessibleName(`Nonce can't be lower than ${CURRENT_NONCE}`))
    expect(setParentSafeNonce).not.toHaveBeenCalledWith(CURRENT_NONCE - 1)
  })

  it('clears the signer nonce when it unmounts', async () => {
    mockParentSafeApi(parentSafeAddress)
    const { clearParentSafeNonce, unmount } = renderParentSafeNonce(parentSafeAddress)
    await getLoadedNonceInput()

    unmount()

    expect(clearParentSafeNonce).toHaveBeenCalled()
  })

  it('shows an error when the parent Safe nonce cannot be loaded', async () => {
    mockParentSafeApi(parentSafeAddress, { noncesFail: true })
    renderParentSafeNonce(parentSafeAddress)

    expect(await screen.findByText("Couldn't load the parent Safe nonce")).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('keeps showing the field when a later refresh of the nonce fails', async () => {
    mockParentSafeApi(parentSafeAddress)
    renderParentSafeNonce(parentSafeAddress)
    await getLoadedNonceInput()
    mockParentSafeApi(parentSafeAddress, { noncesFail: true })

    await act(async () => {
      const args = { chainId: CHAIN_ID, safeAddress: parentSafeAddress }
      await getStoreInstance().dispatch(cgwApi.endpoints.safesGetNoncesV1.initiate(args, { forceRefetch: true }))
    })
    await settle()

    expect(screen.getByRole('combobox')).toHaveValue(String(RECOMMENDED_NONCE))
    expect(screen.queryByText("Couldn't load the parent Safe nonce")).not.toBeInTheDocument()
  })

  it('offers only the recommended nonce when the parent Safe queue cannot be loaded', async () => {
    const user = userEvent.setup()
    mockParentSafeApi(parentSafeAddress, { queueFails: true })
    renderParentSafeNonce(parentSafeAddress)

    await user.click(await getLoadedNonceInput())

    expect(await screen.findByText('Recommended nonce')).toBeInTheDocument()
    expect(screen.queryByText('Replace existing')).not.toBeInTheDocument()
  })
})
