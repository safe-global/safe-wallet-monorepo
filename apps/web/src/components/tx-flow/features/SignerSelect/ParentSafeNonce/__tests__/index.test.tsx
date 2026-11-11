import { http, HttpResponse } from 'msw'
import { userEvent } from '@testing-library/user-event'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { fakerChecksummedAddress, render, screen, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
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

const mockParentSafeApi = (parentSafeAddress: string, { noncesStatus = 200 } = {}) => {
  const safePath = `${GATEWAY_URL}/v1/chains/${CHAIN_ID}/safes/${parentSafeAddress}`
  server.use(
    http.get(`${safePath}/nonces`, () =>
      noncesStatus === 200
        ? HttpResponse.json({ currentNonce: CURRENT_NONCE, recommendedNonce: RECOMMENDED_NONCE })
        : HttpResponse.json({ message: 'Unavailable' }, { status: noncesStatus }),
    ),
    http.get(`${safePath}/transactions/queued`, () => HttpResponse.json(queuedPage(QUEUED_NONCE))),
  )
}

const renderParentSafeNonce = (parentSafeAddress: string) => {
  const setParentSafeNonce = jest.fn()
  const walletContext = { setParentSafeNonce } as unknown as WalletContextType
  const view = render(
    <WalletContext.Provider value={walletContext}>
      <ParentSafeNonce parentSafeAddress={parentSafeAddress} />
    </WalletContext.Provider>,
  )
  return { ...view, setParentSafeNonce }
}

const getNonceInput = () => screen.findByRole('combobox')

describe('ParentSafeNonce', () => {
  const parentSafeAddress = fakerChecksummedAddress()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeInfo.mockReturnValue({ safe: extendedSafeInfoBuilder().with({ chainId: CHAIN_ID }).build() })
  })

  it('starts at the parent Safe recommended nonce and hands it to the signer', async () => {
    mockParentSafeApi(parentSafeAddress)
    const { setParentSafeNonce } = renderParentSafeNonce(parentSafeAddress)

    expect(await getNonceInput()).toHaveValue(String(RECOMMENDED_NONCE))
    expect(setParentSafeNonce).toHaveBeenLastCalledWith(RECOMMENDED_NONCE)
  })

  it('offers the parent Safe queued txs as nonces to replace', async () => {
    const user = userEvent.setup()
    mockParentSafeApi(parentSafeAddress)
    renderParentSafeNonce(parentSafeAddress)

    await user.click(await getNonceInput())

    expect(await screen.findByText('Replace existing')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: new RegExp(`^${QUEUED_NONCE} -`) })).toBeInTheDocument()
  })

  it('hands the signer a nonce the user types', async () => {
    const user = userEvent.setup()
    mockParentSafeApi(parentSafeAddress)
    const { setParentSafeNonce } = renderParentSafeNonce(parentSafeAddress)
    const input = await getNonceInput()
    await waitFor(() => expect(input).toHaveValue(String(RECOMMENDED_NONCE)))

    await user.clear(input)
    await user.type(input, String(QUEUED_NONCE))

    await waitFor(() => expect(setParentSafeNonce).toHaveBeenLastCalledWith(QUEUED_NONCE))
  })

  it('rejects a nonce below the parent Safe on-chain nonce', async () => {
    const user = userEvent.setup()
    mockParentSafeApi(parentSafeAddress)
    const { setParentSafeNonce } = renderParentSafeNonce(parentSafeAddress)
    const input = await getNonceInput()
    await waitFor(() => expect(input).toHaveValue(String(RECOMMENDED_NONCE)))

    await user.clear(input)
    await user.type(input, String(CURRENT_NONCE - 1))

    await waitFor(() => expect(input).toHaveAccessibleName(`Nonce can't be lower than ${CURRENT_NONCE}`))
    expect(setParentSafeNonce).not.toHaveBeenCalledWith(CURRENT_NONCE - 1)
  })

  it('clears the nonce it handed to the signer when it unmounts', async () => {
    mockParentSafeApi(parentSafeAddress)
    const { setParentSafeNonce, unmount } = renderParentSafeNonce(parentSafeAddress)
    await waitFor(() => expect(setParentSafeNonce).toHaveBeenLastCalledWith(RECOMMENDED_NONCE))

    unmount()

    expect(setParentSafeNonce).toHaveBeenLastCalledWith(undefined)
  })

  it('shows an error when the parent Safe nonce cannot be loaded', async () => {
    mockParentSafeApi(parentSafeAddress, { noncesStatus: 500 })
    renderParentSafeNonce(parentSafeAddress)

    expect(await screen.findByText("Couldn't load the parent Safe nonce")).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})
