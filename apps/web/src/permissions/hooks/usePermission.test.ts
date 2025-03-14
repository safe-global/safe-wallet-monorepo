import { renderHook } from '@/tests/test-utils'
import { usePermission } from './usePermission'
import * as useRoles from './useRoles'
import * as useRoleProps from './useRoleProps'
import type { SpendingLimitState } from '@/store/spendingLimitsSlice'
import * as getRolePermissions from '../getRolePermissions'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as useWallet from '@/hooks/wallets/useWallet'
import { Permission, Role } from '../config'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { faker } from '@faker-js/faker'

describe('usePermission', () => {
  const useRolesSpy = jest.spyOn(useRoles, 'useRoles')
  const useRolePropsSpy = jest.spyOn(useRoleProps, 'useRoleProps')
  const getRolePermissionsSpy = jest.spyOn(getRolePermissions, 'getRolePermissions')
  const useSafeInfoSpy = jest.spyOn(useSafeInfo, 'default')
  const useWalletSpy = jest.spyOn(useWallet, 'default')

  const mockSpendingLimits = [{ limit: 1000 }, { limit: 2000 }] as unknown as SpendingLimitState[]
  const mockRoles = [Role.Owner, Role.Proposer, Role.Recoverer, Role.SpendingLimitBeneficiary]
  const mockRoleProps = { [Role.SpendingLimitBeneficiary]: { spendingLimits: mockSpendingLimits } }
  const mockRolePermissions = {
    [Role.Owner]: {
      [Permission.CreateTransaction]: true,
      [Permission.SignTransaction]: true,
      [Permission.ProposeTransaction]: true,
    },
    [Role.Proposer]: {
      [Permission.ProposeTransaction]: true,
    },
    [Role.SpendingLimitBeneficiary]: {
      [Permission.CreateSpendingLimitTransaction]: () => true,
    },
  }

  const safeAddress = faker.finance.ethereumAddress()
  const walletAddress = faker.finance.ethereumAddress()

  const mockSafe = extendedSafeInfoBuilder()
    .with({ address: { value: safeAddress } })
    .with({ deployed: true })
    .build()

  const mockWallet = {
    address: walletAddress,
  } as ReturnType<typeof useWallet.default>

  beforeEach(() => {
    useRolesSpy.mockReturnValue(mockRoles)
    useRolePropsSpy.mockReturnValue(mockRoleProps)
    getRolePermissionsSpy.mockReturnValue(mockRolePermissions)

    useSafeInfoSpy.mockReturnValue({
      safeAddress,
      safe: mockSafe,
    } as unknown as ReturnType<typeof useSafeInfo.default>)

    useWalletSpy.mockReturnValue(mockWallet)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return correct permission value for each role', () => {
    const { result } = renderHook(() => usePermission(Permission.ProposeTransaction))

    expect(result.current).toEqual({ [Role.Owner]: true, [Role.Proposer]: true })

    expect(useRolesSpy).toHaveBeenCalledTimes(1)
    expect(useRolePropsSpy).toHaveBeenCalledTimes(1)
    expect(getRolePermissionsSpy).toHaveBeenCalledTimes(1)
    expect(getRolePermissionsSpy).toHaveBeenCalledWith(mockRoles, { safe: mockSafe, wallet: mockWallet }, mockRoleProps)
    expect(useSafeInfoSpy).toHaveBeenCalledTimes(1)
    expect(useWalletSpy).toHaveBeenCalledTimes(1)
  })

  it('should return correct permission value for each role when the permission is a function', () => {
    const { result } = renderHook(() => usePermission(Permission.CreateSpendingLimitTransaction, undefined))

    expect(result.current).toEqual({ [Role.SpendingLimitBeneficiary]: true })

    expect(useRolesSpy).toHaveBeenCalledTimes(1)
    expect(useRolePropsSpy).toHaveBeenCalledTimes(1)
    expect(getRolePermissionsSpy).toHaveBeenCalledTimes(1)
    expect(getRolePermissionsSpy).toHaveBeenCalledWith(mockRoles, { safe: mockSafe, wallet: mockWallet }, mockRoleProps)
    expect(useSafeInfoSpy).toHaveBeenCalledTimes(1)
    expect(useWalletSpy).toHaveBeenCalledTimes(1)
  })

  it("should return empty object when permission is defined for none of the user's role", () => {
    useRolesSpy.mockReturnValueOnce([Role.Proposer, Role.Recoverer])
    getRolePermissionsSpy.mockReturnValueOnce({
      [Role.Proposer]: {
        [Permission.ProposeTransaction]: true,
      },
      [Role.SpendingLimitBeneficiary]: {
        [Permission.CreateSpendingLimitTransaction]: () => true,
      },
    })

    const { result } = renderHook(() => usePermission(Permission.SignTransaction))

    expect(result.current).toEqual({})

    expect(useRolesSpy).toHaveBeenCalledTimes(1)
    expect(useRolePropsSpy).toHaveBeenCalledTimes(1)
    expect(getRolePermissionsSpy).toHaveBeenCalledTimes(1)
    expect(getRolePermissionsSpy).toHaveBeenCalledWith(
      [Role.Proposer, Role.Recoverer],
      { safe: mockSafe, wallet: mockWallet },
      mockRoleProps,
    )
    expect(useSafeInfoSpy).toHaveBeenCalledTimes(1)
    expect(useWalletSpy).toHaveBeenCalledTimes(1)
  })

  it('should return empty object when no roles are defined', () => {
    useRolesSpy.mockReturnValueOnce([])
    getRolePermissionsSpy.mockReturnValueOnce({})

    const { result } = renderHook(() => usePermission(Permission.SignTransaction))

    expect(result.current).toEqual({})

    expect(useRolesSpy).toHaveBeenCalledTimes(1)
    expect(useRolePropsSpy).toHaveBeenCalledTimes(1)
    expect(getRolePermissionsSpy).toHaveBeenCalledTimes(1)
    expect(getRolePermissionsSpy).toHaveBeenCalledWith([], { safe: mockSafe, wallet: mockWallet }, mockRoleProps)
    expect(useSafeInfoSpy).toHaveBeenCalledTimes(1)
    expect(useWalletSpy).toHaveBeenCalledTimes(1)
  })
})
