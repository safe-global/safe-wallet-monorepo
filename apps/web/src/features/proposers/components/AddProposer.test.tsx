import type { ReactElement, ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { render, fakerChecksummedAddress } from '@/tests/test-utils'
import {
  PROPOSER_LABEL_PLACEHOLDER,
  SMART_CONTRACT_PROPOSER_ERROR,
  SMART_CONTRACT_PROPOSER_INFO,
} from '@/features/proposers/constants'
import { act, fireEvent, waitFor } from '@testing-library/react'
import * as proposerUtils from '@/features/proposers/utils/utils'
import * as walletUtils from '@/utils/wallets'
import AddProposer from './AddProposer'
import useWallet from '@/hooks/wallets/useWallet'
import { useDelegatorSelection } from '../hooks/useDelegatorSelection'
import { getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import { MockEip1193Provider } from '@/tests/mocks/providers'
import * as useChainsModule from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { ZERO_ADDRESS, SENTINEL_ADDRESS } from '@safe-global/utils/utils/constants'
import { getStoreInstance } from '@/store'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('../hooks/useDelegatorSelection')
jest.mock('@/services/tx/tx-sender/sdk')
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/delegates', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/delegates'),
  useDelegatesPostDelegateV1Mutation: jest.fn(),
  useDelegatesPostDelegateV2Mutation: jest.fn(),
  useDelegatesPostDelegateV3Mutation: jest.fn(),
}))
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (ok: boolean) => ReactElement }) => children(true),
}))

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}))

const { useDelegatesPostDelegateV1Mutation, useDelegatesPostDelegateV2Mutation, useDelegatesPostDelegateV3Mutation } =
  jest.requireMock<
    Record<
      | 'useDelegatesPostDelegateV1Mutation'
      | 'useDelegatesPostDelegateV2Mutation'
      | 'useDelegatesPostDelegateV3Mutation',
      jest.Mock
    >
  >('@safe-global/store/gateway/AUTO_GENERATED/delegates')

const mockDelegateChain = (isQueueService: boolean) => {
  const chain = chainBuilder()
    .with({ features: isQueueService ? [FEATURES.QUEUE_SERVICE] : [] })
    .build()
  jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(chain)
  return chain
}

// Chain-agnostic so the assertions need no useChainId mock
const addressBookName = (address: string): string | undefined =>
  Object.values(getStoreInstance().getState().addressBook)
    .map((book) => book[address])
    .find(Boolean)

const mockDelegatorSelection = (): ReturnType<typeof useDelegatorSelection> => ({
  delegatorOptions: [],
  setSelectedDelegator: jest.fn(),
  effectiveDelegator: undefined,
  parentSafeAddress: undefined,
  parentThreshold: undefined,
  parentOwners: undefined,
  isMultiSigRequired: false,
  isParentLoading: false,
})

describe('AddProposer signing logic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // test-utils hydrates the store from localStorage, and the address book is persisted there
    localStorage.clear()
  })

  describe('signProposerTypedDataForSafe', () => {
    it('should be exported and callable', () => {
      expect(proposerUtils.signProposerTypedDataForSafe).toBeDefined()
      expect(typeof proposerUtils.signProposerTypedDataForSafe).toBe('function')
    })
  })

  describe('encodeEIP1271Signature', () => {
    it('should be exported and callable', () => {
      expect(proposerUtils.encodeEIP1271Signature).toBeDefined()
      expect(typeof proposerUtils.encodeEIP1271Signature).toBe('function')
    })
  })

  describe('signProposerTypedData', () => {
    it('should be exported and callable', () => {
      expect(proposerUtils.signProposerTypedData).toBeDefined()
      expect(typeof proposerUtils.signProposerTypedData).toBe('function')
    })
  })

  describe.each([
    { service: 'queue service', isQueueService: true },
    { service: 'transaction service', isQueueService: false },
  ])('the name stays on the device on a $service chain', ({ isQueueService }) => {
    const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>
    const mockUseDelegatorSelection = useDelegatorSelection as jest.MockedFunction<typeof useDelegatorSelection>
    const mockGetSigner = getAssertedChainSigner as jest.MockedFunction<typeof getAssertedChainSigner>

    const addDelegateV2 = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve() })
    const addDelegateV3 = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve() })
    const addDelegate = isQueueService ? addDelegateV3 : addDelegateV2
    const otherAddDelegate = isQueueService ? addDelegateV2 : addDelegateV3
    const useAddDelegateMutation = isQueueService
      ? useDelegatesPostDelegateV3Mutation
      : useDelegatesPostDelegateV2Mutation

    let chain: ReturnType<typeof mockDelegateChain>

    beforeEach(() => {
      chain = mockDelegateChain(isQueueService)

      mockUseWallet.mockReturnValue({
        address: fakerChecksummedAddress(),
        chainId: '1',
        label: 'MetaMask',
        provider: MockEip1193Provider,
      })

      mockUseDelegatorSelection.mockReturnValue(mockDelegatorSelection())

      mockGetSigner.mockResolvedValue({} as Awaited<ReturnType<typeof getAssertedChainSigner>>)
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(false)
      jest.spyOn(proposerUtils, 'signProposerTypedData').mockResolvedValue('0xsignature')

      useDelegatesPostDelegateV2Mutation.mockReturnValue([addDelegateV2, {}])
      useDelegatesPostDelegateV3Mutation.mockReturnValue([addDelegateV3, {}])
      useDelegatesPostDelegateV1Mutation.mockReturnValue([jest.fn(), {}])
    })

    it('signs the delegate typed data for the current chain', async () => {
      const { getByLabelText, getByTestId } = render(<AddProposer onClose={jest.fn()} onSuccess={jest.fn()} />)

      const address = fakerChecksummedAddress()

      act(() => {
        fireEvent.change(getByLabelText(/Address/i), { target: { value: address } })
        fireEvent.change(getByLabelText(/Name/i), { target: { value: faker.person.firstName() } })
      })

      await waitFor(() => expect(getByTestId('submit-proposer-btn')).not.toBeDisabled())

      act(() => {
        fireEvent.click(getByTestId('submit-proposer-btn'))
      })

      await waitFor(() => expect(addDelegate).toHaveBeenCalled())

      expect(proposerUtils.signProposerTypedData).toHaveBeenCalledWith(
        chain,
        address,
        expect.any(String),
        'add',
        expect.anything(),
      )
      expect(addDelegate.mock.calls[0][0].createDelegateDto).toEqual(
        expect.objectContaining({ delegate: address, signature: '0xsignature' }),
      )
      expect(otherAddDelegate).not.toHaveBeenCalled()
    })

    it('sends a placeholder label to the delegate API, never the entered name', async () => {
      const { getByLabelText, getByTestId } = render(<AddProposer onClose={jest.fn()} onSuccess={jest.fn()} />)

      const address = fakerChecksummedAddress()

      act(() => {
        fireEvent.change(getByLabelText(/Address/i), { target: { value: address } })
        fireEvent.change(getByLabelText(/Name/i), { target: { value: 'Foo—Bar' } })
      })

      await waitFor(() => expect(getByTestId('submit-proposer-btn')).not.toBeDisabled())

      act(() => {
        fireEvent.click(getByTestId('submit-proposer-btn'))
      })

      await waitFor(() => expect(addDelegate).toHaveBeenCalled())

      const { label } = addDelegate.mock.calls[0][0].createDelegateDto
      expect(label).toBe(PROPOSER_LABEL_PLACEHOLDER)
      expect(label).not.toContain('Foo')
    })

    it('saves the sanitized name to the local address book instead', async () => {
      const { getByLabelText, getByTestId } = render(<AddProposer onClose={jest.fn()} onSuccess={jest.fn()} />)

      const address = fakerChecksummedAddress()

      act(() => {
        fireEvent.change(getByLabelText(/Address/i), { target: { value: address } })
        fireEvent.change(getByLabelText(/Name/i), { target: { value: '  Foo—Bar  ' } })
      })

      await waitFor(() => expect(getByTestId('submit-proposer-btn')).not.toBeDisabled())

      act(() => {
        fireEvent.click(getByTestId('submit-proposer-btn'))
      })

      await waitFor(() => expect(addDelegate).toHaveBeenCalled())
      await waitFor(() => expect(addressBookName(address)).toBe('Foo-Bar'))
    })

    it('does not save the name locally when the delegate request fails', async () => {
      const failingAddDelegate = jest
        .fn()
        .mockReturnValue({ unwrap: () => Promise.reject(new Error('Request failed with status 500')) })
      useAddDelegateMutation.mockReturnValue([failingAddDelegate, {}])

      const { getByLabelText, getByTestId, findByText } = render(
        <AddProposer onClose={jest.fn()} onSuccess={jest.fn()} />,
      )

      const address = fakerChecksummedAddress()

      act(() => {
        fireEvent.change(getByLabelText(/Address/i), { target: { value: address } })
        fireEvent.change(getByLabelText(/Name/i), { target: { value: faker.person.firstName() } })
      })

      await waitFor(() => expect(getByTestId('submit-proposer-btn')).not.toBeDisabled())

      act(() => {
        fireEvent.click(getByTestId('submit-proposer-btn'))
      })

      expect(await findByText('Error adding proposer')).toBeInTheDocument()
      expect(addressBookName(address)).toBeUndefined()
    })
  })

  describe('without a loaded chain config', () => {
    const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>
    const mockUseDelegatorSelection = useDelegatorSelection as jest.MockedFunction<typeof useDelegatorSelection>

    const addDelegateV2 = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve() })
    const addDelegateV3 = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve() })

    beforeEach(() => {
      jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(undefined)

      mockUseWallet.mockReturnValue({
        address: fakerChecksummedAddress(),
        chainId: '1',
        label: 'MetaMask',
        provider: MockEip1193Provider,
      })

      mockUseDelegatorSelection.mockReturnValue(mockDelegatorSelection())

      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(false)
      jest.spyOn(proposerUtils, 'signProposerTypedData').mockResolvedValue('0xsignature')

      useDelegatesPostDelegateV2Mutation.mockReturnValue([addDelegateV2, {}])
      useDelegatesPostDelegateV3Mutation.mockReturnValue([addDelegateV3, {}])
      useDelegatesPostDelegateV1Mutation.mockReturnValue([jest.fn(), {}])
    })

    it('neither signs nor submits the proposer', async () => {
      const onSuccess = jest.fn()
      const { getByLabelText, getByTestId } = render(<AddProposer onClose={jest.fn()} onSuccess={onSuccess} />)

      act(() => {
        fireEvent.change(getByLabelText(/Address/i), { target: { value: fakerChecksummedAddress() } })
        fireEvent.change(getByLabelText(/Name/i), { target: { value: faker.person.firstName() } })
      })

      await waitFor(() => expect(getByTestId('submit-proposer-btn')).not.toBeDisabled())

      await act(async () => {
        fireEvent.click(getByTestId('submit-proposer-btn'))
      })

      expect(getAssertedChainSigner).not.toHaveBeenCalled()
      expect(proposerUtils.signProposerTypedData).not.toHaveBeenCalled()
      expect(addDelegateV2).not.toHaveBeenCalled()
      expect(addDelegateV3).not.toHaveBeenCalled()
      expect(onSuccess).not.toHaveBeenCalled()
    })
  })

  describe('smart contract address validation', () => {
    const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>
    const mockUseDelegatorSelection = useDelegatorSelection as jest.MockedFunction<typeof useDelegatorSelection>

    const addDelegateV3 = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve() })

    beforeEach(() => {
      mockDelegateChain(true)

      mockUseWallet.mockReturnValue({
        address: fakerChecksummedAddress(),
        chainId: '1',
        label: 'MetaMask',
        provider: MockEip1193Provider,
      })

      mockUseDelegatorSelection.mockReturnValue(mockDelegatorSelection())

      useDelegatesPostDelegateV3Mutation.mockReturnValue([addDelegateV3, {}])
      useDelegatesPostDelegateV1Mutation.mockReturnValue([jest.fn(), {}])
    })

    it.each([
      ['the zero address', ZERO_ADDRESS],
      ['the sentinel address', SENTINEL_ADDRESS],
    ])('shows an error and keeps submit disabled for %s', async (_label, reservedAddress) => {
      // Both contain no hex letters, so they pass checksum validation and used
      // to reach the backend as "Error adding proposer" (WA-3005 Bucket A)
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(false)

      const { getByLabelText, getByTestId, findByText } = render(
        <AddProposer onClose={jest.fn()} onSuccess={jest.fn()} />,
      )

      act(() => {
        fireEvent.change(getByLabelText(/Address/i), { target: { value: reservedAddress } })
        fireEvent.change(getByLabelText(/Name/i), { target: { value: 'Reserved' } })
      })

      expect(await findByText('This proposer address is not valid')).toBeInTheDocument()
      expect(getByTestId('submit-proposer-btn')).toBeDisabled()
      expect(addDelegateV3).not.toHaveBeenCalled()
    })

    it('shows an error and keeps submit disabled when the address is a smart contract', async () => {
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(true)

      const { getByLabelText, getByTestId, findByText } = render(
        <AddProposer onClose={jest.fn()} onSuccess={jest.fn()} />,
      )

      act(() => {
        fireEvent.change(getByLabelText(/Address/i), { target: { value: fakerChecksummedAddress() } })
        fireEvent.change(getByLabelText(/Name/i), { target: { value: 'My other Safe' } })
      })

      await findByText(SMART_CONTRACT_PROPOSER_ERROR, {}, { timeout: 3000 })
      expect(getByTestId('submit-proposer-btn')).toBeDisabled()
      expect(addDelegateV3).not.toHaveBeenCalled()
    })

    it('allows an EOA address', async () => {
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(false)

      const { getByLabelText, getByTestId, queryByText } = render(
        <AddProposer onClose={jest.fn()} onSuccess={jest.fn()} />,
      )

      act(() => {
        fireEvent.change(getByLabelText(/Address/i), { target: { value: fakerChecksummedAddress() } })
        fireEvent.change(getByLabelText(/Name/i), { target: { value: 'An EOA' } })
      })

      await waitFor(() => expect(getByTestId('submit-proposer-btn')).not.toBeDisabled())
      expect(queryByText(SMART_CONTRACT_PROPOSER_ERROR)).toBeNull()
    })

    it('explains on the disabled button why a smart contract cannot be a proposer', async () => {
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(true)

      const { getByLabelText, findByText } = render(<AddProposer onClose={jest.fn()} onSuccess={jest.fn()} />)

      act(() => {
        fireEvent.change(getByLabelText(/Address/i), { target: { value: fakerChecksummedAddress() } })
        fireEvent.change(getByLabelText(/Name/i), { target: { value: 'My other Safe' } })
      })

      await findByText(SMART_CONTRACT_PROPOSER_ERROR, {}, { timeout: 3000 })
      expect(await findByText(SMART_CONTRACT_PROPOSER_INFO)).toBeInTheDocument()
    })

    it('does not show the smart contract info for a valid EOA address', async () => {
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(false)

      const { getByLabelText, getByTestId, queryByText } = render(
        <AddProposer onClose={jest.fn()} onSuccess={jest.fn()} />,
      )

      act(() => {
        fireEvent.change(getByLabelText(/Address/i), { target: { value: fakerChecksummedAddress() } })
        fireEvent.change(getByLabelText(/Name/i), { target: { value: 'An EOA' } })
      })

      await waitFor(() => expect(getByTestId('submit-proposer-btn')).not.toBeDisabled())
      expect(queryByText(SMART_CONTRACT_PROPOSER_INFO)).toBeNull()
    })
  })

  describe('error copy', () => {
    const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>
    const mockUseDelegatorSelection = useDelegatorSelection as jest.MockedFunction<typeof useDelegatorSelection>
    const mockGetSigner = getAssertedChainSigner as jest.MockedFunction<typeof getAssertedChainSigner>

    const submitProposer = async (addDelegateV3: jest.Mock) => {
      useDelegatesPostDelegateV3Mutation.mockReturnValue([addDelegateV3, {}])

      const utils = render(<AddProposer onClose={jest.fn()} onSuccess={jest.fn()} />)

      act(() => {
        fireEvent.change(utils.getByLabelText(/Address/i), { target: { value: fakerChecksummedAddress() } })
        fireEvent.change(utils.getByLabelText(/Name/i), { target: { value: faker.person.firstName() } })
      })

      await waitFor(() => expect(utils.getByTestId('submit-proposer-btn')).not.toBeDisabled())

      act(() => {
        fireEvent.click(utils.getByTestId('submit-proposer-btn'))
      })

      return utils
    }

    beforeEach(() => {
      mockDelegateChain(true)

      mockUseWallet.mockReturnValue({
        address: fakerChecksummedAddress(),
        chainId: '1',
        label: 'MetaMask',
        provider: MockEip1193Provider,
      })

      mockUseDelegatorSelection.mockReturnValue(mockDelegatorSelection())

      mockGetSigner.mockResolvedValue({} as Awaited<ReturnType<typeof getAssertedChainSigner>>)
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(false)
      jest.spyOn(proposerUtils, 'signProposerTypedData').mockResolvedValue('0xsignature')

      useDelegatesPostDelegateV1Mutation.mockReturnValue([jest.fn(), {}])
    })

    it('names the owner who already signed instead of the generic error', async () => {
      const owner = '0x4c3c38a459F0bAABB763290111B66ed01b5fEfA2'
      const addDelegateV3 = jest.fn().mockReturnValue({
        unwrap: () => Promise.reject({ status: 400, data: { message: `Signature for owner ${owner} already exists` } }),
      })

      const { findByText, queryByText } = await submitProposer(addDelegateV3)

      expect(
        await findByText(
          'The owner 0x4c3c...EfA2 already confirmed this request. Sign with a different owner to continue.',
        ),
      ).toBeInTheDocument()
      expect(queryByText('Error adding proposer')).toBeNull()
    })

    it('shows the rejected-signature copy when the wallet rejects', async () => {
      jest
        .spyOn(proposerUtils, 'signProposerTypedData')
        .mockRejectedValue(Object.assign(new Error('denied'), { code: 'ACTION_REJECTED' }))

      const { findByText } = await submitProposer(jest.fn())

      expect(await findByText('The signature request was rejected. Try again to continue.')).toBeInTheDocument()
    })
  })
})
