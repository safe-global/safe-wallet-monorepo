import type { ReactElement, ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { render, fakerChecksummedAddress } from '@/tests/test-utils'
import {
  SMART_CONTRACT_PROPOSER_EDIT_ERROR,
  SMART_CONTRACT_PROPOSER_ERROR,
  SMART_CONTRACT_PROPOSER_INFO,
} from '@/features/proposers/constants'
import { act, fireEvent, waitFor } from '@testing-library/react'
import * as proposerUtils from '@/features/proposers/utils/utils'
import * as walletUtils from '@/utils/wallets'
import UpsertProposer from './UpsertProposer'
import useWallet from '@/hooks/wallets/useWallet'
import { useDelegatorSelection } from '../hooks/useDelegatorSelection'
import { getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import { useDelegatesPostDelegateV2Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { MockEip1193Provider } from '@/tests/mocks/providers'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('../hooks/useDelegatorSelection')
jest.mock('@/services/tx/tx-sender/sdk')
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/delegates', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/delegates'),
  useDelegatesPostDelegateV1Mutation: jest.fn(),
  useDelegatesPostDelegateV2Mutation: jest.fn(),
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

const { useDelegatesPostDelegateV1Mutation } = jest.requireMock('@safe-global/store/gateway/AUTO_GENERATED/delegates')

describe('UpsertProposer signing logic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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

  describe('name sanitization on submit', () => {
    const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>
    const mockUseDelegatorSelection = useDelegatorSelection as jest.MockedFunction<typeof useDelegatorSelection>
    const mockGetSigner = getAssertedChainSigner as jest.MockedFunction<typeof getAssertedChainSigner>
    const mockUseAddDelegateV2 = useDelegatesPostDelegateV2Mutation as jest.MockedFunction<
      typeof useDelegatesPostDelegateV2Mutation
    >

    const addDelegateV2 = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve() })

    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        address: fakerChecksummedAddress(),
        chainId: '1',
        label: 'MetaMask',
        provider: MockEip1193Provider,
      })

      mockUseDelegatorSelection.mockReturnValue({
        delegatorOptions: [],
        setSelectedDelegator: jest.fn(),
        effectiveDelegator: undefined,
        parentSafeAddress: undefined,
        parentThreshold: undefined,
        parentOwners: undefined,
        isMultiSigRequired: false,
        isParentLoading: false,
        canEdit: true,
      })

      mockGetSigner.mockResolvedValue({} as Awaited<ReturnType<typeof getAssertedChainSigner>>)
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(false)
      jest.spyOn(proposerUtils, 'signProposerTypedData').mockResolvedValue('0xsignature')

      mockUseAddDelegateV2.mockReturnValue([addDelegateV2, {} as never])
      useDelegatesPostDelegateV1Mutation.mockReturnValue([jest.fn(), {}])
    })

    it('sends a sanitized label to the delegate API when the raw name has smart punctuation', async () => {
      const { getByLabelText, getByTestId } = render(<UpsertProposer onClose={jest.fn()} onSuccess={jest.fn()} />)

      const address = fakerChecksummedAddress()

      act(() => {
        fireEvent.change(getByLabelText(/Address/i), { target: { value: address } })
        fireEvent.change(getByLabelText(/Name/i), { target: { value: 'Foo—Bar' } })
      })

      await waitFor(() => expect(getByTestId('submit-proposer-btn')).not.toBeDisabled())

      act(() => {
        fireEvent.click(getByTestId('submit-proposer-btn'))
      })

      await waitFor(() =>
        expect(addDelegateV2).toHaveBeenCalledWith(
          expect.objectContaining({
            createDelegateDto: expect.objectContaining({ label: 'Foo-Bar' }),
          }),
        ),
      )
    })

    it('trims surrounding whitespace from the label before calling the delegate API', async () => {
      const { getByLabelText, getByTestId } = render(<UpsertProposer onClose={jest.fn()} onSuccess={jest.fn()} />)

      const address = fakerChecksummedAddress()

      act(() => {
        fireEvent.change(getByLabelText(/Address/i), { target: { value: address } })
        fireEvent.change(getByLabelText(/Name/i), { target: { value: `  ${faker.person.firstName()}  ` } })
      })

      await waitFor(() => expect(getByTestId('submit-proposer-btn')).not.toBeDisabled())

      act(() => {
        fireEvent.click(getByTestId('submit-proposer-btn'))
      })

      await waitFor(() => expect(addDelegateV2).toHaveBeenCalled())
      const label = addDelegateV2.mock.calls[0][0].createDelegateDto.label
      expect(label).toBe(label.trim())
    })
  })

  describe('smart contract address validation', () => {
    const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>
    const mockUseDelegatorSelection = useDelegatorSelection as jest.MockedFunction<typeof useDelegatorSelection>
    const mockUseAddDelegateV2 = useDelegatesPostDelegateV2Mutation as jest.MockedFunction<
      typeof useDelegatesPostDelegateV2Mutation
    >

    const addDelegateV2 = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve() })

    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        address: fakerChecksummedAddress(),
        chainId: '1',
        label: 'MetaMask',
        provider: MockEip1193Provider,
      })

      mockUseDelegatorSelection.mockReturnValue({
        delegatorOptions: [],
        setSelectedDelegator: jest.fn(),
        effectiveDelegator: undefined,
        parentSafeAddress: undefined,
        parentThreshold: undefined,
        parentOwners: undefined,
        isMultiSigRequired: false,
        isParentLoading: false,
        canEdit: true,
      })

      mockUseAddDelegateV2.mockReturnValue([addDelegateV2, {} as never])
      useDelegatesPostDelegateV1Mutation.mockReturnValue([jest.fn(), {}])
    })

    it('shows an error and keeps submit disabled when the address is a smart contract', async () => {
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(true)

      const { getByLabelText, getByTestId, findByText } = render(
        <UpsertProposer onClose={jest.fn()} onSuccess={jest.fn()} />,
      )

      act(() => {
        fireEvent.change(getByLabelText(/Address/i), { target: { value: fakerChecksummedAddress() } })
        fireEvent.change(getByLabelText(/Name/i), { target: { value: 'My other Safe' } })
      })

      await findByText(SMART_CONTRACT_PROPOSER_ERROR, {}, { timeout: 3000 })
      expect(getByTestId('submit-proposer-btn')).toBeDisabled()
      expect(addDelegateV2).not.toHaveBeenCalled()
    })

    it('allows an EOA address', async () => {
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(false)

      const { getByLabelText, getByTestId, queryByText } = render(
        <UpsertProposer onClose={jest.fn()} onSuccess={jest.fn()} />,
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

      const { getByLabelText, findByText } = render(<UpsertProposer onClose={jest.fn()} onSuccess={jest.fn()} />)

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
        <UpsertProposer onClose={jest.fn()} onSuccess={jest.fn()} />,
      )

      act(() => {
        fireEvent.change(getByLabelText(/Address/i), { target: { value: fakerChecksummedAddress() } })
        fireEvent.change(getByLabelText(/Name/i), { target: { value: 'An EOA' } })
      })

      await waitFor(() => expect(getByTestId('submit-proposer-btn')).not.toBeDisabled())
      expect(queryByText(SMART_CONTRACT_PROPOSER_INFO)).toBeNull()
    })
  })

  describe('smart contract guard on submit (edit flow)', () => {
    const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>
    const mockUseDelegatorSelection = useDelegatorSelection as jest.MockedFunction<typeof useDelegatorSelection>
    const mockGetSigner = getAssertedChainSigner as jest.MockedFunction<typeof getAssertedChainSigner>
    const mockUseAddDelegateV2 = useDelegatesPostDelegateV2Mutation as jest.MockedFunction<
      typeof useDelegatesPostDelegateV2Mutation
    >

    const addDelegateV2 = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve() })

    const proposer = {
      delegate: fakerChecksummedAddress(),
      delegator: fakerChecksummedAddress(),
      safe: fakerChecksummedAddress(),
      label: 'Existing proposer',
    }

    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        address: fakerChecksummedAddress(),
        chainId: '1',
        label: 'MetaMask',
        provider: MockEip1193Provider,
      })

      mockUseDelegatorSelection.mockReturnValue({
        delegatorOptions: [],
        setSelectedDelegator: jest.fn(),
        effectiveDelegator: undefined,
        parentSafeAddress: undefined,
        parentThreshold: undefined,
        parentOwners: undefined,
        isMultiSigRequired: false,
        isParentLoading: false,
        canEdit: true,
      })

      mockGetSigner.mockResolvedValue({} as Awaited<ReturnType<typeof getAssertedChainSigner>>)
      jest.spyOn(proposerUtils, 'signProposerTypedData').mockResolvedValue('0xsignature')

      mockUseAddDelegateV2.mockReturnValue([addDelegateV2, {} as never])
      useDelegatesPostDelegateV1Mutation.mockReturnValue([jest.fn(), {}])
    })

    it('blocks submitting an edit when the existing proposer is a smart contract', async () => {
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(true)

      const { getByTestId, findByText } = render(
        <UpsertProposer onClose={jest.fn()} onSuccess={jest.fn()} proposer={proposer} />,
      )

      await waitFor(() => expect(getByTestId('submit-proposer-btn')).not.toBeDisabled())

      act(() => {
        fireEvent.click(getByTestId('submit-proposer-btn'))
      })

      expect(await findByText(SMART_CONTRACT_PROPOSER_EDIT_ERROR)).toBeInTheDocument()
      expect(addDelegateV2).not.toHaveBeenCalled()
    })

    it('submits an edit when the existing proposer is an EOA', async () => {
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(false)

      const { getByTestId, queryByText } = render(
        <UpsertProposer onClose={jest.fn()} onSuccess={jest.fn()} proposer={proposer} />,
      )

      await waitFor(() => expect(getByTestId('submit-proposer-btn')).not.toBeDisabled())

      act(() => {
        fireEvent.click(getByTestId('submit-proposer-btn'))
      })

      await waitFor(() =>
        expect(addDelegateV2).toHaveBeenCalledWith(
          expect.objectContaining({
            createDelegateDto: expect.objectContaining({ delegate: proposer.delegate }),
          }),
        ),
      )
      expect(queryByText(SMART_CONTRACT_PROPOSER_EDIT_ERROR)).toBeNull()
    })
  })
})
