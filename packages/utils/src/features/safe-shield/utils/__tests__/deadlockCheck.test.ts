import { computeProjectedState, checkDeadlock } from '../deadlockCheck'
import { DeadlockStatus } from '../../types'
import { SafeOwnerInfo } from '../../types'

describe('computeProjectedState', () => {
  const currentOwners = ['0xAAA', '0xBBB']
  const currentThreshold = 2

  it('adds an owner and updates threshold', () => {
    const result = computeProjectedState(currentOwners, currentThreshold, {
      type: 'addOwner',
      ownerAddress: '0xCCC',
      threshold: 2,
    })
    expect(result.owners).toEqual(['0xAAA', '0xBBB', '0xCCC'])
    expect(result.threshold).toBe(2)
  })

  it('removes an owner and updates threshold', () => {
    const result = computeProjectedState(currentOwners, currentThreshold, {
      type: 'removeOwner',
      ownerAddress: '0xBBB',
      threshold: 1,
    })
    expect(result.owners).toEqual(['0xAAA'])
    expect(result.threshold).toBe(1)
  })

  it('removes owner case-insensitively', () => {
    const result = computeProjectedState(currentOwners, currentThreshold, {
      type: 'removeOwner',
      ownerAddress: '0xbbb',
      threshold: 1,
    })
    expect(result.owners).toEqual(['0xAAA'])
  })

  it('swaps an owner and preserves threshold', () => {
    const result = computeProjectedState(currentOwners, currentThreshold, {
      type: 'swapOwner',
      oldOwnerAddress: '0xBBB',
      newOwnerAddress: '0xCCC',
    })
    expect(result.owners).toEqual(['0xAAA', '0xCCC'])
    expect(result.threshold).toBe(2)
  })

  it('changes threshold and preserves owners', () => {
    const result = computeProjectedState(currentOwners, currentThreshold, {
      type: 'changeThreshold',
      threshold: 1,
    })
    expect(result.owners).toEqual(['0xAAA', '0xBBB'])
    expect(result.threshold).toBe(1)
  })
})

describe('checkDeadlock', () => {
  const editedSafe = '0xSafeA'

  it('returns valid when no Safe owners are provided (all EOAs)', () => {
    const result = checkDeadlock(editedSafe, ['0xEOA1', '0xEOA2'], 2, [])
    expect(result.status).toBe(DeadlockStatus.VALID)
    expect(result.hasDeepNesting).toBe(false)
    expect(result.fetchFailures).toEqual([])
  })

  it('returns blocked for mutual 2/2 deadlock', () => {
    const safeOwnerInfos: SafeOwnerInfo[] = [
      {
        address: '0xSafeB',
        owners: ['0xEOA2', '0xSafeA'],
        threshold: 2,
        hasNestedSafes: false,
        fetchError: false,
      },
    ]

    const result = checkDeadlock(editedSafe, ['0xEOA1', '0xSafeB'], 2, safeOwnerInfos)
    expect(result.status).toBe(DeadlockStatus.BLOCKED)
    expect(result.mutualOwnerAddress).toBe('0xSafeB')
    expect(result.reason).toContain('cannot collect enough valid signatures')
  })

  it('returns valid when Safe can reach threshold without circular owner', () => {
    const safeOwnerInfos: SafeOwnerInfo[] = [
      {
        address: '0xSafeB',
        owners: ['0xEOA2', '0xSafeA'],
        threshold: 2,
        hasNestedSafes: false,
        fetchError: false,
      },
    ]

    // 3 owners, threshold 2 — can reach threshold with EOA1 + EOA3 alone
    const result = checkDeadlock(editedSafe, ['0xEOA1', '0xSafeB', '0xEOA3'], 2, safeOwnerInfos)
    expect(result.status).toBe(DeadlockStatus.VALID)
  })

  it('returns valid when threshold is 1 (EOA alone suffices)', () => {
    const safeOwnerInfos: SafeOwnerInfo[] = [
      {
        address: '0xSafeB',
        owners: ['0xEOA2', '0xSafeA'],
        threshold: 2,
        hasNestedSafes: false,
        fetchError: false,
      },
    ]

    const result = checkDeadlock(editedSafe, ['0xEOA1', '0xSafeB'], 1, safeOwnerInfos)
    expect(result.status).toBe(DeadlockStatus.VALID)
  })

  it('returns warning when no mutual ownership but deep nesting exists', () => {
    const safeOwnerInfos: SafeOwnerInfo[] = [
      {
        address: '0xSafeB',
        owners: ['0xEOA2', '0xSafeC'],
        threshold: 1,
        hasNestedSafes: true,
        fetchError: false,
      },
    ]

    const result = checkDeadlock(editedSafe, ['0xEOA1', '0xSafeB'], 1, safeOwnerInfos)
    expect(result.status).toBe(DeadlockStatus.WARNING)
    expect(result.hasDeepNesting).toBe(true)
    expect(result.reason).toContain('could not be verified beyond direct owners')
  })

  it('returns valid when no mutual ownership and no deep nesting', () => {
    const safeOwnerInfos: SafeOwnerInfo[] = [
      {
        address: '0xSafeB',
        owners: ['0xEOA2', '0xEOA3'],
        threshold: 1,
        hasNestedSafes: false,
        fetchError: false,
      },
    ]

    const result = checkDeadlock(editedSafe, ['0xEOA1', '0xSafeB'], 1, safeOwnerInfos)
    expect(result.status).toBe(DeadlockStatus.VALID)
    expect(result.hasDeepNesting).toBe(false)
  })

  it('returns unknown when a fetch failed', () => {
    const safeOwnerInfos: SafeOwnerInfo[] = [
      {
        address: '0xSafeB',
        owners: [],
        threshold: 0,
        hasNestedSafes: false,
        fetchError: true,
      },
    ]

    const result = checkDeadlock(editedSafe, ['0xEOA1', '0xSafeB'], 2, safeOwnerInfos)
    expect(result.status).toBe(DeadlockStatus.UNKNOWN)
    expect(result.fetchFailures).toEqual(['0xSafeB'])
  })

  it('handles case-insensitive address comparison for mutual ownership', () => {
    const safeOwnerInfos: SafeOwnerInfo[] = [
      {
        address: '0xSafeB',
        owners: ['0xEOA2', '0xsafea'], // lowercase
        threshold: 2,
        hasNestedSafes: false,
        fetchError: false,
      },
    ]

    const result = checkDeadlock(editedSafe, ['0xEOA1', '0xSafeB'], 2, safeOwnerInfos)
    expect(result.status).toBe(DeadlockStatus.BLOCKED)
  })
})
