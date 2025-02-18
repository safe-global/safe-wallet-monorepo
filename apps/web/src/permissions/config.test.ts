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
    const mockSpendingLimits = [
      { token: { address: '0xToken1' }, beneficiary: faker.finance.ethereumAddress(), amount: '1000', spent: '0' },
      { token: { address: '0xToken2' }, beneficiary: faker.finance.ethereumAddress(), amount: '2000', spent: '0' },
    ] as SpendingLimitState[]

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
      const mockTokenAddress = '0xToken1'

      it('should return `false` if no wallet connected', () => {
        const permissions = rolePermissionsConfig[Role.SpendingLimitBeneficiary]!(
          { safe: mockSafe, wallet: null },
          { spendingLimits: mockSpendingLimits },
        )

        expect(permissions[Permission.CreateSpendingLimitTransaction]!({ tokenAddress: mockTokenAddress })).toBe(false)
      })

      describe('without tokenAddress', () => {
        it('should return `true` if any spending limit defined for connected wallet address', () => {
          const permissions = rolePermissionsConfig[Role.SpendingLimitBeneficiary]!(mockCommonProps, {
            spendingLimits: [
              ...mockSpendingLimits,
              { token: { address: '0xToken3' }, beneficiary: walletAddress, amount: '3000', spent: '0' },
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
              { token: { address: mockTokenAddress }, beneficiary: walletAddress, amount: '3000', spent: '0' },
            ] as SpendingLimitState[],
          })

          expect(permissions[Permission.CreateSpendingLimitTransaction]!({ tokenAddress: mockTokenAddress })).toBe(true)
        })

        it('should return `false` if no spending limit defined for token and connected wallet address', () => {
          const permissions = rolePermissionsConfig[Role.SpendingLimitBeneficiary]!(mockCommonProps, {
            spendingLimits: mockSpendingLimits,
          })

          expect(permissions[Permission.CreateSpendingLimitTransaction]!({ tokenAddress: mockTokenAddress })).toBe(
            false,
          )
        })

        it('should return `false` if the spending limit defined is reached', () => {
          const permissions = rolePermissionsConfig[Role.SpendingLimitBeneficiary]!(mockCommonProps, {
            spendingLimits: [
              ...mockSpendingLimits,
              { token: { address: mockTokenAddress }, beneficiary: walletAddress, amount: '3000', spent: '3000' },
            ] as SpendingLimitState[],
          })

          expect(permissions[Permission.CreateSpendingLimitTransaction]!({ tokenAddress: mockTokenAddress })).toBe(
            false,
          )
        })
      })
    })
  })
})
