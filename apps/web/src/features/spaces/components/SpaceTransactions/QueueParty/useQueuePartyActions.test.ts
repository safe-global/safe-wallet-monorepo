import { act, renderHook } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { getExplorerName, useQueuePartyActions } from './useQueuePartyActions'

const ADDRESS = '0x1234567890123456789012345678901234567890'

const mockChain = chainBuilder()
  .with({
    chainId: '1',
    blockExplorerUriTemplate: { address: 'https://etherscan.io/address/{{address}}', txHash: '', api: '' },
  })
  .build()
jest.mock('@/hooks/useChains', () => ({ useChain: () => mockChain }))

const mockAdd = jest.fn()
jest.mock('./AddToAddressBook', () => ({ useAddToAddressBook: () => mockAdd }))

describe('getExplorerName', () => {
  it.each([
    ['https://etherscan.io/address/0x1', 'Etherscan'],
    ['https://www.basescan.org/address/0x1', 'Basescan'],
    ['https://arbiscan.io/address/0x1', 'Arbiscan'],
  ])('names %s %s', (href, name) => {
    expect(getExplorerName(href)).toBe(name)
  })
})

describe('useQueuePartyActions', () => {
  it("links to the address on the chain's explorer", () => {
    const { result } = renderHook(() => useQueuePartyActions(ADDRESS, '1', true))

    expect(result.current.explorer).toEqual({ href: `https://etherscan.io/address/${ADDRESS}`, label: 'Etherscan' })
  })

  it('offers the address book only for an unnamed address', () => {
    expect(renderHook(() => useQueuePartyActions(ADDRESS, '1', true)).result.current.onAddToAddressBook).toBeUndefined()
    expect(renderHook(() => useQueuePartyActions(ADDRESS, '1', false)).result.current.onAddToAddressBook).toBe(mockAdd)
  })

  it('copies the address and reports it', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    const { result } = renderHook(() => useQueuePartyActions(ADDRESS, '1', true))

    await act(async () => {
      result.current.onCopy()
    })

    expect(writeText).toHaveBeenCalledWith(ADDRESS)
    expect(result.current.copied).toBe(true)
  })
})
