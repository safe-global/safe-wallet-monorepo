import { renderHook } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { useSignedHash } from './useSignedHash'

const safeInterface = Safe__factory.createInterface()

const txDataWith = (hexData: string | null): TransactionData => ({
  hexData,
  dataDecoded: null,
  to: { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
  value: '0',
  operation: 0,
  trustedDelegateCallTarget: null,
  addressInfoIndex: null,
})

describe('useSignedHash', () => {
  it('returns the hash approved by approveHash calldata', () => {
    const hash = faker.string.hexadecimal({ length: 64, casing: 'lower' })

    const { result } = renderHook(() =>
      useSignedHash(txDataWith(safeInterface.encodeFunctionData('approveHash', [hash]))),
    )

    expect(result.current).toBe(hash)
  })

  it('returns undefined for calldata of another method', () => {
    const { result } = renderHook(() =>
      useSignedHash(txDataWith(safeInterface.encodeFunctionData('changeThreshold', [2]))),
    )

    expect(result.current).toBeUndefined()
  })

  it('returns undefined without calldata', () => {
    expect(renderHook(() => useSignedHash(txDataWith(null))).result.current).toBeUndefined()
    expect(renderHook(() => useSignedHash(null)).result.current).toBeUndefined()
    expect(renderHook(() => useSignedHash(undefined)).result.current).toBeUndefined()
  })

  it('returns undefined for truncated approveHash calldata', () => {
    const selector = safeInterface.getFunction('approveHash').selector

    const { result } = renderHook(() => useSignedHash(txDataWith(`${selector}1234`)))

    expect(result.current).toBeUndefined()
  })
})
