import { faker } from '@faker-js/faker'
import { renderHook } from '@/src/tests/test-utils'
import { generateSafeOverview, generateSigner } from '@/src/tests/factories/safe'
import type { Address } from '@/src/types/address'
import { useHasSigner } from './useHasSigner'

const SAFE = faker.finance.ethereumAddress() as Address
const OWNER_A = faker.finance.ethereumAddress()
const OWNER_B = faker.finance.ethereumAddress()

const overview = (owners: string[], chainId = '1') => generateSafeOverview({ chainId, owners, address: SAFE })

describe('useHasSigner', () => {
  it('returns the owners of the active Safe that have an imported signer', () => {
    const { result } = renderHook(() => useHasSigner(), {
      activeSafe: { address: SAFE, chainId: '1' },
      safes: { [SAFE]: { '1': overview([OWNER_A, OWNER_B]) } },
      signers: { [OWNER_A]: generateSigner(OWNER_A) },
    })

    expect(result.current.hasSigner).toBe(true)
    expect(result.current.safeSigners).toEqual([OWNER_A])
  })

  it('returns all matching owners when several signers are imported', () => {
    const { result } = renderHook(() => useHasSigner(), {
      activeSafe: { address: SAFE, chainId: '1' },
      safes: { [SAFE]: { '1': overview([OWNER_A, OWNER_B]) } },
      signers: { [OWNER_A]: generateSigner(OWNER_A), [OWNER_B]: generateSigner(OWNER_B) },
    })

    expect(result.current.hasSigner).toBe(true)
    expect(result.current.safeSigners).toEqual([OWNER_A, OWNER_B])
  })

  it('returns hasSigner false when no imported signer is an owner', () => {
    const { result } = renderHook(() => useHasSigner(), {
      activeSafe: { address: SAFE, chainId: '1' },
      safes: { [SAFE]: { '1': overview([OWNER_A]) } },
      signers: { [OWNER_B]: generateSigner(OWNER_B) },
    })

    expect(result.current.hasSigner).toBe(false)
    expect(result.current.safeSigners).toEqual([])
  })

  it('only considers owners on the active chain', () => {
    const { result } = renderHook(() => useHasSigner(), {
      activeSafe: { address: SAFE, chainId: '137' },
      safes: { [SAFE]: { '1': overview([OWNER_A]), '137': overview([OWNER_B], '137') } },
      signers: { [OWNER_A]: generateSigner(OWNER_A) },
    })

    expect(result.current.hasSigner).toBe(false)
    expect(result.current.safeSigners).toEqual([])
  })

  it('returns hasSigner false when the Safe overview for the active chain is not loaded', () => {
    const { result } = renderHook(() => useHasSigner(), {
      activeSafe: { address: SAFE, chainId: '137' },
      safes: { [SAFE]: { '1': overview([OWNER_A]) } },
      signers: { [OWNER_A]: generateSigner(OWNER_A) },
    })

    expect(result.current.hasSigner).toBe(false)
    expect(result.current.safeSigners).toEqual([])
  })
})
