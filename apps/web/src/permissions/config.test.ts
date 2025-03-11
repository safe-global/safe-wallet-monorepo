import { faker } from '@faker-js/faker'
import rolePermissionsConfig, { Permission, Role } from './config'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import type useWallet from '@/hooks/wallets/useWallet'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import type { SpendingLimitState } from '@/store/spendingLimitsSlice'

describe('RolePermissionsConfig', () => {
  const safeAddress = faker.finance.ethereumAddress()
  const walletAddress = faker.finance.ethereumAddress()

  const mockSafeTx = { data: { nonce: 1 } } as SafeTransaction

  const mockSafe = extendedSafeInfoBuilder()
    .with({ address: { value: safeAddress }, owners: [{ value: walletAddress }] })
    .with({ deployed: true })
    .build()

  const mockWallet = {
    address: walletAddress,
  } as ReturnType<typeof useWallet>

  const mockCommonProps = {
    safe: mockSafe,
    wallet: mockWallet,
  }

  describe('Owner', () => {
    it('should return correct permissions', () => {
      const permissions = rolePermissionsConfig[Role.Owner]!(mockCommonProps)
      expect(permissions).toEqual({
        [Permission.CreateTransaction]: true,
        [Permission.ProposeTransaction]: true,
        [Permission.SignTransaction]: true,
        [Permission.ExecuteTransaction]: expect.any(Function),
        [Permission.EnablePushNotifications]: true,
      })
      expect(permissions[Permission.ExecuteTransaction]!({ safeTx: mockSafeTx })).toBe(true)
    })
  })

  describe('Proposer', () => {
    it('should return correct permissions', () => {
      const permissions = rolePermissionsConfig[Role.Proposer]!(mockCommonProps)
      expect(permissions).toEqual({
        [Permission.CreateTransaction]: true,
        [Permission.ProposeTransaction]: true,
        [Permission.ExecuteTransaction]: expect.any(Function),
        [Permission.EnablePushNotifications]: true,
      })
      expect(permissions[Permission.ExecuteTransaction]!({ safeTx: mockSafeTx })).toBe(true)
    })
  })

  describe('Executioner', () => {
    it('should return correct permissions', () => {
      const permissions = rolePermissionsConfig[Role.Executioner]!(mockCommonProps)
      expect(permissions).toEqual({
        [Permission.ExecuteTransaction]: expect.any(Function),
        [Permission.EnablePushNotifications]: true,
      })
      expect(permissions[Permission.ExecuteTransaction]!({ safeTx: mockSafeTx })).toBe(true)
    })
  })

  describe('SpendingLimitBeneficiary', () => {
    const mockSpendingLimits = new Array(3).fill(null).map(() => ({
      token: { address: faker.finance.ethereumAddress() },
      beneficiary: faker.finance.ethereumAddress(),
      amount: faker.finance.amount({ min: 1000, max: 5000, dec: 0 }),
      spent: faker.finance.amount({ min: 0, max: 1000, dec: 0 }),
    })) as SpendingLimitState[]

    it('should return correct permissions', () => {
      const permissions = rolePermissionsConfig[Role.SpendingLimitBeneficiary]!(mockCommonProps, {
        spendingLimits: mockSpendingLimits,
      })

      expect(permissions).toEqual({
        [Permission.ExecuteTransaction]: expect.any(Function),
        [Permission.EnablePushNotifications]: true,
        [Permission.CreateSpendingLimitTransaction]: expect.any(Function),
      })

      expect(permissions[Permission.ExecuteTransaction]!({ safeTx: mockSafeTx })).toBe(true)
    })

    describe('CreateSpendingLimitTransaction', () => {
      const tokenAddress = mockSpendingLimits[0].token.address

      it('should return `false` if no wallet connected', () => {
        const permissions = rolePermissionsConfig[Role.SpendingLimitBeneficiary]!(
          { safe: mockSafe, wallet: null },
          { spendingLimits: mockSpendingLimits },
        )

        expect(permissions[Permission.CreateSpendingLimitTransaction]!({ tokenAddress })).toBe(false)
      })

      describe('without tokenAddress', () => {
        it('should return `true` if any spending limit defined for connected wallet address', () => {
          const permissions = rolePermissionsConfig[Role.SpendingLimitBeneficiary]!(mockCommonProps, {
            spendingLimits: [
              ...mockSpendingLimits,
              {
                token: { address: faker.finance.ethereumAddress() },
                beneficiary: walletAddress,
                amount: faker.finance.amount({ min: 1000, max: 5000, dec: 0 }),
                spent: faker.finance.amount({ min: 0, max: 1000, dec: 0 }),
              },
            ] as SpendingLimitState[],
          })

          expect(permissions[Permission.CreateSpendingLimitTransaction]!({})).toBe(true)
        })

        it('should return `false` if no spending limit defined for connected wallet address', () => {
          const permissions = rolePermissionsConfig[Role.SpendingLimitBeneficiary]!(mockCommonProps, {
            spendingLimits: mockSpendingLimits,
          })

          expect(permissions[Permission.CreateSpendingLimitTransaction]!({})).toBe(false)
        })
      })

      describe('with tokenAddress', () => {
        it('should return `true` if a spending limit defined for token and connected wallet address', () => {
          const permissions = rolePermissionsConfig[Role.SpendingLimitBeneficiary]!(mockCommonProps, {
            spendingLimits: [
              ...mockSpendingLimits,
              {
                token: { address: tokenAddress },
                beneficiary: walletAddress,
                amount: faker.finance.amount({ min: 1000, max: 5000, dec: 0 }),
                spent: faker.finance.amount({ min: 0, max: 1000, dec: 0 }),
              },
            ] as SpendingLimitState[],
          })

          expect(permissions[Permission.CreateSpendingLimitTransaction]!({ tokenAddress })).toBe(true)
        })

        it('should return `false` if no spending limit defined for token and connected wallet address', () => {
          const permissions = rolePermissionsConfig[Role.SpendingLimitBeneficiary]!(mockCommonProps, {
            spendingLimits: mockSpendingLimits,
          })

          expect(permissions[Permission.CreateSpendingLimitTransaction]!({ tokenAddress })).toBe(false)
        })

        it('should return `false` if the spending limit defined is reached', () => {
          const mockAmount = faker.finance.amount({ min: 1000, max: 5000, dec: 0 })

          const permissions = rolePermissionsConfig[Role.SpendingLimitBeneficiary]!(mockCommonProps, {
            spendingLimits: [
              ...mockSpendingLimits,
              { token: { address: tokenAddress }, beneficiary: walletAddress, amount: mockAmount, spent: mockAmount },
            ] as SpendingLimitState[],
          })

          expect(permissions[Permission.CreateSpendingLimitTransaction]!({ tokenAddress })).toBe(false)
        })
      })
    })
  })
})
