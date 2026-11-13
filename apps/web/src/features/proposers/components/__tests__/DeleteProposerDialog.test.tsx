import { faker } from '@faker-js/faker'
import { getDelegateTypedData } from '@safe-global/utils/services/delegates'
import { http, HttpResponse } from 'msw'
import { BrowserProvider, JsonRpcSigner } from 'ethers'
import type { Delegate } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { render, screen, waitFor, fireEvent, fakerChecksummedAddress } from '@/tests/test-utils'
import { mockSafeInfo, mockChainId, mockCurrentChain } from '@/tests/mocks/hooks'
import { mockRole, type TestRole } from '@/tests/mocks/roles'
import { safeInfoBuilder } from '@/tests/builders/safe'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { getStoreInstance } from '@/store'
import useWallet from '@/hooks/wallets/useWallet'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
import { getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import * as walletUtils from '@/utils/wallets'
import { encodeEIP1271Signature } from '@/features/proposers/utils/utils'
import DeleteProposerDialog from '../DeleteProposerDialog'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/hooks/useIsWrongChain')
jest.mock('@/hooks/useProposers')
jest.mock('@/hooks/useIsNestedSafeOwner')
jest.mock('@/hooks/coreSDK/safeCoreSDK')
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useNestedSafeOwners')
jest.mock('@/hooks/useChainId')
jest.mock('@/services/tx/tx-sender/sdk')
jest.mock('@/hooks/useChains', () => ({
  ...jest.requireActual('@/hooks/useChains'),
  useCurrentChain: jest.fn(),
}))

jest.mock('@/features/spending-limits', () => ({
  ...jest.requireActual('@/features/spending-limits'),
  useIsOnlySpendingLimitBeneficiary: jest.fn(),
}))

const SIGNATURE = `0x${'a'.repeat(64)}${'b'.repeat(64)}1b`
const CHAIN_ID = '1'

const proposerBuilder = (overrides: Partial<Delegate> = {}): Delegate => ({
  delegate: fakerChecksummedAddress(),
  delegator: fakerChecksummedAddress(),
  label: faker.person.firstName(),
  ...overrides,
})

const mockConnectedRole = (role: TestRole) => {
  const wallet = mockRole(role)
  if (!wallet) throw new Error(`The ${role} role has no connected wallet`)
  return wallet
}

const mockSigner = (address: string) => {
  const signer = new JsonRpcSigner(new BrowserProvider({ request: jest.fn() }), address)
  jest.spyOn(signer.provider, 'send').mockResolvedValue(SIGNATURE)
  jest.spyOn(signer, 'signTypedData').mockResolvedValue(SIGNATURE)
  jest.spyOn(signer, 'signMessage').mockResolvedValue(SIGNATURE)
  jest.mocked(getAssertedChainSigner).mockResolvedValue(signer)
  return signer
}

const mockDelegateChain = (isQueueService: boolean) =>
  mockCurrentChain({ chainId: CHAIN_ID, features: isQueueService ? [FEATURES.QUEUE_SERVICE] : [] })

type RecordedRequest = { version: string; delegate: string; body: unknown }

const recordDeleteRequests = (status = 204) => {
  const requests: RecordedRequest[] = []
  server.use(
    http.delete(`${GATEWAY_URL}/:version/chains/:chainId/delegates/:delegate`, async ({ request, params }) => {
      requests.push({ version: String(params.version), delegate: String(params.delegate), body: await request.json() })
      return status === 204 ? new HttpResponse(null, { status }) : HttpResponse.json({ message: 'Failed' }, { status })
    }),
  )
  return requests
}

const recordParentMessages = (parentSafeAddress: string) => {
  const messages: Array<{ signature: string; origin: string }> = []
  server.use(
    http.post(`${GATEWAY_URL}/v1/chains/:chainId/safes/${parentSafeAddress}/messages`, async ({ request }) => {
      messages.push((await request.json()) as { signature: string; origin: string })
      return HttpResponse.json({})
    }),
  )
  return messages
}

const mockParentSafe = (address: string, threshold: number) => {
  const owners = Array.from({ length: Math.max(threshold, 2) }, () => ({ value: fakerChecksummedAddress() }))
  server.use(
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/${address}`, () =>
      HttpResponse.json(
        safeInfoBuilder()
          .with({ address: { value: address }, threshold, owners })
          .build(),
      ),
    ),
  )
}

const getDeleteButton = () => screen.getByTestId('delete-proposer-btn')

const confirmDelete = async () => {
  fireEvent.click(getDeleteButton())
  const confirmButton = await screen.findByTestId('confirm-delete-proposer-btn')
  await waitFor(() => expect(confirmButton).toBeEnabled())
  fireEvent.click(confirmButton)
}

const notificationTitles = () =>
  getStoreInstance()
    .getState()
    .notifications.map(({ title }) => title)

describe('DeleteProposerDialog', () => {
  let safeAddress: string

  beforeEach(() => {
    jest.clearAllMocks()
    safeAddress = mockSafeInfo({ deployed: true }).address.value
    mockChainId(CHAIN_ID)
    jest.mocked(useNestedSafeOwners).mockReturnValue([])
    jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(false)
  })

  it('enables delete for the delegate', () => {
    const { address } = mockConnectedRole('proposer')

    render(<DeleteProposerDialog proposer={proposerBuilder({ delegate: address })} />)

    expect(getDeleteButton()).toBeEnabled()
  })

  it('enables delete for the delegator', () => {
    const { address } = mockConnectedRole('owner')

    render(<DeleteProposerDialog proposer={proposerBuilder({ delegator: address })} />)

    expect(getDeleteButton()).toBeEnabled()
  })

  it('enables delete for a nested Safe owner whose parent Safe is the delegator', () => {
    const parentSafeAddress = fakerChecksummedAddress()
    mockRole('nestedOwner')
    jest.mocked(useNestedSafeOwners).mockReturnValue([parentSafeAddress])

    render(<DeleteProposerDialog proposer={proposerBuilder({ delegator: parentSafeAddress })} />)

    expect(getDeleteButton()).toBeEnabled()
  })

  it.each(['owner', 'proposer', 'nestedOwner', 'disconnected'] as const)(
    'disables delete for %s who is neither the delegate nor the delegator',
    (role) => {
      mockRole(role)

      render(<DeleteProposerDialog proposer={proposerBuilder()} />)

      expect(getDeleteButton()).toBeDisabled()
    },
  )

  describe.each([
    { service: 'queue service', isQueueService: true, version: 'v3' },
    { service: 'transaction service', isQueueService: false, version: 'v2' },
  ])('an owner on a $service chain', ({ isQueueService, version }) => {
    let ownerAddress: string

    beforeEach(() => {
      ownerAddress = mockConnectedRole('owner').address
      mockSigner(ownerAddress)
      mockDelegateChain(isQueueService)
    })

    it(`deletes the proposer through the ${version} endpoint with the owner as delegator`, async () => {
      const requests = recordDeleteRequests()
      const proposer = proposerBuilder({ delegator: ownerAddress })

      render(<DeleteProposerDialog proposer={proposer} />)
      await confirmDelete()

      await waitFor(() => expect(requests).toHaveLength(1))
      expect(requests[0]).toEqual({
        version,
        delegate: proposer.delegate,
        body: { delegator: ownerAddress, safe: safeAddress, signature: SIGNATURE },
      })
    })

    it('closes the dialog and confirms the deletion once the request succeeds', async () => {
      recordDeleteRequests()

      render(<DeleteProposerDialog proposer={proposerBuilder({ delegator: ownerAddress })} />)
      await confirmDelete()

      await waitFor(() => expect(screen.queryByText('Delete this proposer?')).not.toBeInTheDocument())
      expect(notificationTitles()).toContain('Proposer deleted successfully!')
    })

    it('keeps the dialog open with an error when the request fails', async () => {
      recordDeleteRequests(500)

      render(<DeleteProposerDialog proposer={proposerBuilder({ delegator: ownerAddress })} />)
      await confirmDelete()

      expect(await screen.findByText('Error deleting proposer')).toBeInTheDocument()
      expect(screen.getByText('Delete this proposer?')).toBeInTheDocument()
      expect(notificationTitles()).not.toContain('Proposer deleted successfully!')
    })
  })

  it('signs the v1 proposer message and deletes through v1 for an eth_sign wallet on a transaction service chain', async () => {
    const wallet = mockConnectedRole('owner')
    jest.mocked(useWallet).mockReturnValue({ ...wallet, label: 'Trezor' })
    const signer = mockSigner(wallet.address)
    mockDelegateChain(false)
    const requests = recordDeleteRequests()
    const proposer = proposerBuilder({ delegator: wallet.address })

    render(<DeleteProposerDialog proposer={proposer} />)
    await confirmDelete()

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(signer.signMessage).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`^${proposer.delegate}\\d+$`)))
    expect(requests[0]).toEqual({
      version: 'v1',
      delegate: proposer.delegate,
      body: { delegate: proposer.delegate, delegator: wallet.address, signature: SIGNATURE },
    })
  })

  describe('a nested Safe owner', () => {
    const parentSafeAddress = fakerChecksummedAddress()

    beforeEach(() => {
      mockRole('nestedOwner')
      jest.mocked(useNestedSafeOwners).mockReturnValue([parentSafeAddress])
    })

    it('deletes with an EIP-1271 signature of the parent Safe as delegator when the parent is 1/n', async () => {
      const signer = mockSigner(fakerChecksummedAddress())
      mockDelegateChain(true)
      mockParentSafe(parentSafeAddress, 1)
      const requests = recordDeleteRequests()
      const proposer = proposerBuilder({ delegator: parentSafeAddress })

      render(<DeleteProposerDialog proposer={proposer} />)
      await confirmDelete()

      await waitFor(() => expect(requests).toHaveLength(1))
      expect(signer.signTypedData).toHaveBeenCalledWith(
        { verifyingContract: parentSafeAddress, chainId: Number(CHAIN_ID) },
        { SafeMessage: [{ type: 'bytes', name: 'message' }] },
        { message: expect.stringMatching(/^0x[0-9a-f]{64}$/) },
      )
      expect(requests[0]).toEqual({
        version: 'v3',
        delegate: proposer.delegate,
        body: {
          delegator: parentSafeAddress,
          safe: safeAddress,
          signature: await encodeEIP1271Signature(parentSafeAddress, SIGNATURE),
        },
      })
    })

    it('creates a removal message on the parent Safe instead of deleting when the parent needs more signatures', async () => {
      mockSigner(fakerChecksummedAddress())
      mockDelegateChain(true)
      mockParentSafe(parentSafeAddress, 2)
      const deleteRequests = recordDeleteRequests()
      const messages = recordParentMessages(parentSafeAddress)
      const proposer = proposerBuilder({ delegator: parentSafeAddress })

      render(<DeleteProposerDialog proposer={proposer} />)
      fireEvent.click(getDeleteButton())
      expect(await screen.findByText(/This requires 2 of 2 parent Safe owner signatures/)).toBeInTheDocument()
      fireEvent.click(screen.getByTestId('confirm-delete-proposer-btn'))

      expect(await screen.findByText('Signature collection initiated')).toBeInTheDocument()
      expect(screen.getByText('1 of 2 signatures collected')).toBeInTheDocument()
      expect(messages).toHaveLength(1)
      expect(messages[0].signature).toBe(SIGNATURE)
      expect(JSON.parse(messages[0].origin)).toEqual({
        type: 'proposer-delegation',
        action: 'remove',
        delegate: proposer.delegate,
        nestedSafe: safeAddress,
      })
      expect(deleteRequests).toHaveLength(0)
    })

    it('tells the user to wait for the pending add to expire and starts no signature collection', async () => {
      mockSigner(fakerChecksummedAddress())
      mockDelegateChain(false)
      mockParentSafe(parentSafeAddress, 2)
      const proposer = proposerBuilder({ delegator: parentSafeAddress })
      const lookUpExistingMessages = jest.fn()
      server.use(
        http.post(`${GATEWAY_URL}/v1/chains/:chainId/safes/${parentSafeAddress}/messages`, () =>
          HttpResponse.json({ message: 'Message already exists' }, { status: 400 }),
        ),
        http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/${parentSafeAddress}/messages`, () => {
          lookUpExistingMessages()
          return HttpResponse.json({
            count: 1,
            next: null,
            previous: null,
            results: [
              {
                type: 'MESSAGE',
                messageHash: faker.string.hexadecimal({ length: 64 }),
                message: getDelegateTypedData({ chainId: CHAIN_ID, features: [] }, proposer.delegate),
                origin: JSON.stringify({
                  type: 'proposer-delegation',
                  action: 'add',
                  delegate: proposer.delegate,
                  nestedSafe: safeAddress,
                }),
              },
            ],
          })
        }),
      )

      render(<DeleteProposerDialog proposer={proposer} />)
      fireEvent.click(getDeleteButton())
      expect(await screen.findByText(/This requires 2 of 2 parent Safe owner signatures/)).toBeInTheDocument()
      fireEvent.click(screen.getByTestId('confirm-delete-proposer-btn'))

      expect(await screen.findByText(/Please wait for it to expire \(~1 hour\)/)).toBeInTheDocument()
      expect(lookUpExistingMessages).toHaveBeenCalled()
      expect(screen.getByText('Delete this proposer?')).toBeInTheDocument()
      expect(screen.queryByText('Signature collection initiated')).not.toBeInTheDocument()
    })
  })
})
