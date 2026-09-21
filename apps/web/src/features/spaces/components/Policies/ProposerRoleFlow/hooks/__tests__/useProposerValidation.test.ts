import type { JsonRpcProvider } from 'ethers'
import { renderHook } from '@/tests/test-utils'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { SMART_CONTRACT_PROPOSER_ERROR } from '@/features/proposers/constants'
import { addressIsNotSmartContract } from '@/features/proposers/utils/utils'
import useChainId from '@/hooks/useChainId'
import useProposers from '@/hooks/useProposers'
import useSafeInfo from '@/hooks/useSafeInfo'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import {
  PROPOSER_EXISTS_ERROR,
  PROPOSER_IS_OWNER_ERROR,
  PROPOSER_IS_SAFE_ERROR,
  PROPOSER_RESERVED_ERROR,
} from '../../constants'
import { addressIsNotExistingProposer, useProposerValidation } from '../useProposerValidation'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useChainId')
jest.mock('@/hooks/useProposers')
jest.mock('@/hooks/wallets/web3ReadOnly', () => ({ useWeb3ReadOnly: () => mockProvider }))
jest.mock('@/features/proposers/utils/utils', () => ({
  ...jest.requireActual('@/features/proposers/utils/utils'),
  addressIsNotSmartContract: jest.fn(),
}))

const mockProvider = {} as JsonRpcProvider
const mockUseSafeInfo = jest.mocked(useSafeInfo)
const mockUseChainId = jest.mocked(useChainId)
const mockUseProposers = jest.mocked(useProposers)
const mockAddressIsNotSmartContract = jest.mocked(addressIsNotSmartContract)

const OWNER = '0x1111111111111111111111111111111111111111'
const EXISTING = '0x2222222222222222222222222222222222222222'
const FRESH = '0x3333333333333333333333333333333333333333'
const safe = extendedSafeInfoBuilder()
  .with({ chainId: '137', owners: [{ value: OWNER }] })
  .build()

const mockSafeInfo = (safeAddress: string) =>
  mockUseSafeInfo.mockReturnValue({ safe, safeAddress, safeLoaded: true, safeLoading: false, safeError: undefined })

const mockDelegates = (delegates: string[]) =>
  mockUseProposers.mockReturnValue({
    data: {
      count: delegates.length,
      next: null,
      previous: null,
      results: delegates.map((delegate) => ({
        delegate,
        delegator: OWNER,
        label: 'Proposer',
        safe: safe.address.value,
      })),
    },
  } as ReturnType<typeof useProposers>)

const validate = () => renderHook(() => useProposerValidation()).result.current

describe('addressIsNotExistingProposer', () => {
  it('rejects an address already in the list regardless of casing', () => {
    expect(addressIsNotExistingProposer([EXISTING.toLowerCase()], 'dup')(EXISTING)).toBe('dup')
  })

  it('accepts an address not in the list', () => {
    expect(addressIsNotExistingProposer([EXISTING], 'dup')(FRESH)).toBeUndefined()
  })
})

describe('useProposerValidation', () => {
  beforeEach(() => {
    mockSafeInfo(safe.address.value)
    mockUseChainId.mockReturnValue('137')
    mockDelegates([EXISTING])
    mockAddressIsNotSmartContract.mockClear()
    mockAddressIsNotSmartContract.mockReturnValue(async () => undefined)
  })

  it('rejects the zero address', async () => {
    await expect(validate()(ZERO_ADDRESS)).resolves.toBe(PROPOSER_RESERVED_ERROR)
  })

  it('rejects the Safe itself', async () => {
    await expect(validate()(safe.address.value)).resolves.toBe(PROPOSER_IS_SAFE_ERROR)
  })

  it('rejects a signer of the picked Safe', async () => {
    await expect(validate()(OWNER)).resolves.toBe(PROPOSER_IS_OWNER_ERROR)
  })

  it('rejects an existing proposer of the picked Safe', async () => {
    await expect(validate()(EXISTING)).resolves.toBe(PROPOSER_EXISTS_ERROR)
  })

  it('rejects a smart contract, checked on the picked chain', async () => {
    mockAddressIsNotSmartContract.mockReturnValue(async () => SMART_CONTRACT_PROPOSER_ERROR)

    await expect(validate()(FRESH)).resolves.toBe(SMART_CONTRACT_PROPOSER_ERROR)
    expect(mockAddressIsNotSmartContract).toHaveBeenCalledWith('137', SMART_CONTRACT_PROPOSER_ERROR, mockProvider)
  })

  it('accepts a fresh externally owned account', async () => {
    await expect(validate()(FRESH)).resolves.toBeUndefined()
  })

  it('treats a Safe with no proposers yet like any other', async () => {
    mockUseProposers.mockReturnValue({ data: undefined } as ReturnType<typeof useProposers>)

    await expect(validate()(EXISTING)).resolves.toBeUndefined()
  })

  it('only applies the reserved-address rule while no Safe is picked', async () => {
    mockSafeInfo('')

    await expect(validate()(OWNER)).resolves.toBeUndefined()
    await expect(validate()(ZERO_ADDRESS)).resolves.toBe(PROPOSER_RESERVED_ERROR)
    expect(mockAddressIsNotSmartContract).not.toHaveBeenCalled()
  })
})
