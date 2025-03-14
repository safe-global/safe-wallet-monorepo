import type { SpendingLimitState } from '@/store/spendingLimitsSlice'
import { getRolePermissions } from './getRolePermissions'
import { Role } from './config'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { connectedWalletBuilder } from '@/tests/builders/wallet'
import { faker } from '@faker-js/faker'

const safeAddress = faker.finance.ethereumAddress()
const walletAddress = faker.finance.ethereumAddress()

jest.mock('./config', () => ({
  ...jest.requireActual('./config'),
  __esModule: true,
  default: {
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
    SpendingLimitBeneficiary: (
      { wallet }: { wallet: { address: string } },
      { spendingLimits }: { spendingLimits: number[] },
    ) => ({
      CreateTransaction: spendingLimits.includes(1) && wallet.address === walletAddress,
      ProposeTransaction: spendingLimits.includes(5),
    }),
  },
}))

describe('getRolePermissions', () => {
  it('should return the permissions for the given roles', () => {
    const rolePermissions = getRolePermissions(
      [Role.Owner, Role.Proposer],
      {
        wallet: connectedWalletBuilder().with({ address: walletAddress }).build(),
        safe: extendedSafeInfoBuilder()
          .with({ address: { value: safeAddress }, owners: [{ value: walletAddress }] })
          .with({ deployed: false })
          .build(),
      },
      {},
    )

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
    const rolePermissions = getRolePermissions(
      [Role.Owner, Role.NestedOwner],
      {
        wallet: connectedWalletBuilder().with({ address: walletAddress }).build(),
        safe: extendedSafeInfoBuilder()
          .with({ address: { value: safeAddress }, owners: [{ value: walletAddress }] })
          .with({ deployed: false })
          .build(),
      },
      {},
    )

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
    const rolePermissions = getRolePermissions(
      [Role.SpendingLimitBeneficiary],
      {
        wallet: connectedWalletBuilder().with({ address: walletAddress }).build(),
        safe: extendedSafeInfoBuilder()
          .with({ address: { value: safeAddress }, owners: [{ value: walletAddress }] })
          .with({ deployed: false })
          .build(),
      },
      {
        SpendingLimitBeneficiary: { spendingLimits: [1, 2, 3] as unknown as SpendingLimitState[] },
      },
    )

    expect(rolePermissions).toEqual({
      SpendingLimitBeneficiary: {
        CreateTransaction: true,
        ProposeTransaction: false,
      },
    })
  })

  it('should return an empty object if no permissions are defined for the roles', () => {
    const rolePermissions = getRolePermissions(
      [Role.NestedOwner, Role.Recoverer],
      {
        wallet: connectedWalletBuilder().with({ address: walletAddress }).build(),
        safe: extendedSafeInfoBuilder()
          .with({ address: { value: safeAddress }, owners: [{ value: walletAddress }] })
          .with({ deployed: false })
          .build(),
      },
      {},
    )
    expect(rolePermissions).toEqual({})
  })

  it('should return an empty object if being called with an empty roles array', () => {
    const rolePermissions = getRolePermissions(
      [],
      {
        wallet: connectedWalletBuilder().with({ address: walletAddress }).build(),
        safe: extendedSafeInfoBuilder()
          .with({ address: { value: safeAddress }, owners: [{ value: walletAddress }] })
          .with({ deployed: false })
          .build(),
      },
      {},
    )
    expect(rolePermissions).toEqual({})
  })
})
