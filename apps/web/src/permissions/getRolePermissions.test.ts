import type { SpendingLimitState } from '@/store/spendingLimitsSlice'
import { getRolePermissions } from './getRolePermissions'
import { Role } from './types'

jest.mock('./config', () => ({
  Owner: () => ({
    CreateTransaction: true,
    ProposeTransaction: true,
    SignTransaction: true,
    ExecuteTransaction: () => true,
  }),
  Proposer: () => ({
    CreateTransaction: true,
    ProposeTransaction: true,
    ExecuteTransaction: () => true,
  }),
  SpendingLimitBeneficiary: ({ spendingLimits }: { spendingLimits: number[] }) => ({
    CreateTransaction: spendingLimits.includes(1),
    ProposeTransaction: spendingLimits.includes(5),
  }),
}))

describe('getRolePermissions', () => {
  it('should return the permissions for the given roles', () => {
    const rolePermissions = getRolePermissions([Role.Owner, Role.Proposer], {})

    expect(rolePermissions).toEqual({
      Owner: {
        CreateTransaction: true,
        ProposeTransaction: true,
        SignTransaction: true,
        ExecuteTransaction: expect.any(Function),
      },
      Proposer: {
        CreateTransaction: true,
        ProposeTransaction: true,
        ExecuteTransaction: expect.any(Function),
      },
    })
  })

  it('should ignore roles that do not have permissions defined', () => {
    const rolePermissions = getRolePermissions([Role.Owner, Role.NestedOwner], {})

    expect(rolePermissions).toEqual({
      Owner: {
        CreateTransaction: true,
        ProposeTransaction: true,
        SignTransaction: true,
        ExecuteTransaction: expect.any(Function),
      },
    })
  })

  it('should return the permissions for the given roles with the specific props', () => {
    const rolePermissions = getRolePermissions([Role.SpendingLimitBeneficiary], {
      SpendingLimitBeneficiary: { spendingLimits: [1, 2, 3] as unknown as SpendingLimitState[] },
    })

    expect(rolePermissions).toEqual({
      SpendingLimitBeneficiary: {
        CreateTransaction: true,
        ProposeTransaction: false,
      },
    })
  })

  it('should return an empty object if no permissions are defined for the roles', () => {
    const rolePermissions = getRolePermissions([Role.NestedOwner, Role.Recoverer], {})
    expect(rolePermissions).toEqual({})
  })

  it('should return an empty object if being called with an empty roles array', () => {
    const rolePermissions = getRolePermissions([], {})
    expect(rolePermissions).toEqual({})
  })
})
