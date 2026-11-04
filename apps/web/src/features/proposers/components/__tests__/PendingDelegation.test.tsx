import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { BrowserProvider, JsonRpcSigner } from 'ethers'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { render, screen, waitFor, fireEvent, fakerChecksummedAddress } from '@/tests/test-utils'
import { mockSafeInfo, mockChainId, mockCurrentChain, mockWallet } from '@/tests/mocks/hooks'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { getStoreInstance } from '@/store'
import { getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import { encodeEIP1271Signature } from '@/features/proposers/utils/utils'
import { getCurrentTotp } from '@/features/proposers/utils/totp'
import type { PendingDelegation as PendingDelegationType } from '@/features/proposers/types'
import PendingDelegation from '../PendingDelegation'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useChainId')
jest.mock('@/services/tx/tx-sender/sdk')
jest.mock('@/hooks/useChains', () => ({
  ...jest.requireActual('@/hooks/useChains'),
  useCurrentChain: jest.fn(),
}))
jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

const SIGNATURE = `0x${'a'.repeat(64)}${'b'.repeat(64)}1b`
const CHAIN_ID = '1'

const pendingDelegationBuilder = (overrides: Partial<PendingDelegationType> = {}): PendingDelegationType => ({
  messageHash: faker.string.hexadecimal({ length: 64, casing: 'lower' }),
  action: 'add',
  delegateAddress: fakerChecksummedAddress(),
  nestedSafeAddress: fakerChecksummedAddress(),
  parentSafeAddress: fakerChecksummedAddress(),
  totp: getCurrentTotp(),
  status: 'pending',
  confirmationsSubmitted: 1,
  confirmationsRequired: 3,
  confirmations: [{ owner: { value: fakerChecksummedAddress() }, signature: SIGNATURE }],
  preparedSignature: null,
  creationTimestamp: Date.now(),
  proposedBy: null,
  ...overrides,
})

const recordSignatures = () => {
  const signatures: Array<{ messageHash: string; signature: string }> = []
  server.use(
    http.post(`${GATEWAY_URL}/v1/chains/:chainId/messages/:messageHash/signatures`, async ({ request, params }) => {
      const { signature } = (await request.json()) as { signature: string }
      signatures.push({ messageHash: String(params.messageHash), signature })
      return HttpResponse.json({})
    }),
  )
  return signatures
}

const recordAddedDelegates = () => {
  const delegates: unknown[] = []
  server.use(
    http.post(`${GATEWAY_URL}/v3/chains/:chainId/delegates`, async ({ request }) => {
      delegates.push(await request.json())
      return HttpResponse.json({})
    }),
  )
  return delegates
}

const notificationTitles = () =>
  getStoreInstance()
    .getState()
    .notifications.map(({ title }) => title)

describe('PendingDelegation', () => {
  let walletAddress: string
  let safeAddress: string

  beforeEach(() => {
    jest.clearAllMocks()
    safeAddress = mockSafeInfo({ deployed: true }).address.value
    mockChainId(CHAIN_ID)
    mockCurrentChain({ chainId: CHAIN_ID, features: [FEATURES.QUEUE_SERVICE] })
    walletAddress = fakerChecksummedAddress()
    mockWallet({ address: walletAddress, chainId: CHAIN_ID })

    const signer = new JsonRpcSigner(new BrowserProvider({ request: jest.fn() }), walletAddress)
    jest.spyOn(signer, 'signTypedData').mockResolvedValue(SIGNATURE)
    jest.mocked(getAssertedChainSigner).mockResolvedValue(signer)
  })

  it('shows the proposer to add and how many signatures are collected', () => {
    const delegation = pendingDelegationBuilder()

    render(<PendingDelegation delegation={delegation} onRefetch={jest.fn()} />)

    expect(screen.getByText('New proposer:')).toBeInTheDocument()
    expect(screen.getByText('1/3')).toBeInTheDocument()
    expect(screen.getByText(/Expires in/)).toBeInTheDocument()
  })

  it('labels a pending removal', () => {
    render(<PendingDelegation delegation={pendingDelegationBuilder({ action: 'remove' })} onRefetch={jest.fn()} />)

    expect(screen.getByText('Remove proposer:')).toBeInTheDocument()
  })

  it('adds the signature of the connected owner to the delegation message', async () => {
    const signatures = recordSignatures()
    const onRefetch = jest.fn()
    const delegation = pendingDelegationBuilder()

    render(<PendingDelegation delegation={delegation} onRefetch={onRefetch} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign' }))

    await waitFor(() => expect(onRefetch).toHaveBeenCalled())
    expect(signatures).toEqual([{ messageHash: delegation.messageHash, signature: SIGNATURE }])
    expect(notificationTitles()).toContain('Signature added')
  })

  it('tells the owner the delegation can be submitted when their signature meets the threshold', async () => {
    recordSignatures()
    const onRefetch = jest.fn()

    render(
      <PendingDelegation
        delegation={pendingDelegationBuilder({ confirmationsSubmitted: 1, confirmationsRequired: 2 })}
        onRefetch={onRefetch}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Sign' }))

    await waitFor(() => expect(onRefetch).toHaveBeenCalled())
    expect(notificationTitles()).toContain('Threshold met!')
  })

  it('shows an error when the signature cannot be added', async () => {
    server.use(
      http.post(`${GATEWAY_URL}/v1/chains/:chainId/messages/:messageHash/signatures`, () =>
        HttpResponse.json({ message: 'Failed' }, { status: 500 }),
      ),
    )
    const onRefetch = jest.fn()

    render(<PendingDelegation delegation={pendingDelegationBuilder()} onRefetch={onRefetch} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign' }))

    expect(await screen.findByText('Error signing delegation')).toBeInTheDocument()
    expect(onRefetch).not.toHaveBeenCalled()
  })

  it('offers a share link instead of Sign to an owner who already signed', () => {
    const delegation = pendingDelegationBuilder({
      confirmations: [{ owner: { value: walletAddress }, signature: SIGNATURE }],
    })

    render(<PendingDelegation delegation={delegation} onRefetch={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument()
  })

  it('submits a delegation that reached the threshold to the delegate API as the parent Safe', async () => {
    const delegates = recordAddedDelegates()
    const onRefetch = jest.fn()
    const delegation = pendingDelegationBuilder({
      status: 'ready',
      confirmationsSubmitted: 2,
      confirmationsRequired: 2,
      preparedSignature: SIGNATURE,
    })

    render(<PendingDelegation delegation={delegation} onRefetch={onRefetch} />)
    fireEvent.click(screen.getByRole('button', { name: 'Submit delegation' }))

    await waitFor(() => expect(onRefetch).toHaveBeenCalled())
    expect(delegates).toEqual([
      expect.objectContaining({
        safe: safeAddress,
        delegate: delegation.delegateAddress,
        delegator: delegation.parentSafeAddress,
        signature: await encodeEIP1271Signature(delegation.parentSafeAddress, SIGNATURE),
      }),
    ])
    expect(notificationTitles()).toContain('Proposer added successfully!')
  })

  it('shows an error when the ready delegation cannot be submitted', async () => {
    const delegation = pendingDelegationBuilder({ status: 'ready', preparedSignature: null })

    render(<PendingDelegation delegation={delegation} onRefetch={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Submit delegation' }))

    expect(await screen.findByText('Error submitting delegation')).toBeInTheDocument()
    expect(notificationTitles()).not.toContain('Proposer added successfully!')
  })
})
