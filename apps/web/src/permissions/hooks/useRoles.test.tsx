import { renderHook } from '@/tests/test-utils'
import { useRoles } from './useRoles'
import { Role } from '../types'
import * as useWallet from '@/hooks/wallets/useWallet'
import * as useIsSafeOwner from '@/hooks/useIsSafeOwner'
import * as useIsNestedSafeOwner from '@/hooks/useIsNestedSafeOwner'
import * as useIsWalletProposer from '@/hooks/useProposers'
import * as useIsRecoverer from '@/features/recovery/hooks/useIsRecoverer'
import * as useIsSpendingLimitBeneficiary from '@/hooks/useIsOnlySpendingLimitBeneficiary'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'

describe('useRoles', () => {
  const useWalletSpy = jest.spyOn(useWallet, 'default')
  const useIsSafeOwnerSpy = jest.spyOn(useIsSafeOwner, 'default')
  const useIsNestedSafeOwnerSpy = jest.spyOn(useIsNestedSafeOwner, 'useIsNestedSafeOwner')
  const useIsWalletProposerSpy = jest.spyOn(useIsWalletProposer, 'useIsWalletProposer')
  const useIsRecovererSpy = jest.spyOn(useIsRecoverer, 'useIsRecoverer')
  const useIsSpendingLimitBeneficiarySpy = jest.spyOn(useIsSpendingLimitBeneficiary, 'useIsSpendingLimitBeneficiary')

  beforeEach(() => {
    useWalletSpy.mockReturnValue({} as unknown as ConnectedWallet)
    useIsSafeOwnerSpy.mockReturnValue(true)
    useIsNestedSafeOwnerSpy.mockReturnValue(true)
    useIsWalletProposerSpy.mockReturnValue(true)
    useIsRecovererSpy.mockReturnValue(true)
    useIsSpendingLimitBeneficiarySpy.mockReturnValue(true)
  })

  afterEach(() => {
    expect(useWalletSpy).toHaveBeenCalledTimes(1)
    expect(useIsSafeOwnerSpy).toHaveBeenCalledTimes(1)
    expect(useIsNestedSafeOwnerSpy).toHaveBeenCalledTimes(1)
    expect(useIsWalletProposerSpy).toHaveBeenCalledTimes(1)
    expect(useIsRecovererSpy).toHaveBeenCalledTimes(1)
    expect(useIsSpendingLimitBeneficiarySpy).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
  })

  it('should return correct roles when all conditions are met', () => {
    const { result } = renderHook(() => useRoles())

    expect(result.current).toEqual([
      Role.Owner,
      Role.NestedOwner,
      Role.Proposer,
      Role.Recoverer,
      Role.SpendingLimitBeneficiary,
      Role.Executioner,
    ])
  })

  it('should return correct roles when no wallet is connected', () => {
    useWalletSpy.mockReturnValueOnce(null)
    useIsSafeOwnerSpy.mockReturnValueOnce(false)
    useIsNestedSafeOwnerSpy.mockReturnValueOnce(false)
    useIsWalletProposerSpy.mockReturnValueOnce(false)
    useIsRecovererSpy.mockReturnValueOnce(false)
    useIsSpendingLimitBeneficiarySpy.mockReturnValueOnce(false)

    const { result } = renderHook(() => useRoles())

    expect(result.current).toEqual([Role.NoWalletConnected])
  })

  it('should return correct roles when only some conditions are met', () => {
    useIsSafeOwnerSpy.mockReturnValueOnce(false)
    useIsWalletProposerSpy.mockReturnValueOnce(false)
    useIsSpendingLimitBeneficiarySpy.mockReturnValueOnce(false)

    const { result } = renderHook(() => useRoles())

    expect(result.current).toEqual([Role.NestedOwner, Role.Recoverer, Role.Executioner])
  })
})
