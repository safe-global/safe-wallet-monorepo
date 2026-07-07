import type { ReactElement } from 'react'
import { faker } from '@faker-js/faker'
import { render, fakerChecksummedAddress } from '@/tests/test-utils'
import { act, fireEvent, waitFor } from '@testing-library/react'
import * as proposerUtils from '@/features/proposers/utils/utils'
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
})
