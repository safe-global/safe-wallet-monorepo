import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { buildPolicyMessage, signPolicyUpdate } from '../policyMessage'
import type { CloudCosignerPolicy } from '../../types'

describe('policyMessage', () => {
  const chainId = '1'
  const safeAddress = checksumAddress(faker.finance.ethereumAddress())
  const policy: CloudCosignerPolicy = {
    valueThresholdUsd: 100000,
    reviewUnknownContracts: true,
    instructions: 'Never approve unlimited allowances.',
  }

  describe('buildPolicyMessage', () => {
    it('renders the canonical message the cosigner service verifies', () => {
      const issuedAt = '2026-09-04T10:00:00.000Z'

      expect(buildPolicyMessage({ chainId, safeAddress, issuedAt, policy })).toBe(
        [
          'Safe cloud cosigner policy update',
          'Chain ID: 1',
          `Safe: ${safeAddress}`,
          'Issued at: 2026-09-04T10:00:00.000Z',
          'Value threshold (USD): 100000',
          'Review unknown contracts: true',
          'Instructions:',
          'Never approve unlimited allowances.',
        ].join('\n'),
      )
    })

    it('renders missing instructions as an empty last line', () => {
      const message = buildPolicyMessage({
        chainId,
        safeAddress,
        issuedAt: new Date().toISOString(),
        policy: { ...policy, instructions: null },
      })

      expect(message.endsWith('Instructions:\n')).toBe(true)
    })
  })

  describe('signPolicyUpdate', () => {
    it('signs the message for the given time and returns its ISO timestamp', async () => {
      const now = new Date('2026-09-04T12:34:56.000Z')
      const signMessage = jest.fn().mockResolvedValue('0xsig')

      await expect(signPolicyUpdate({ chainId, safeAddress, policy, signMessage, now })).resolves.toEqual({
        signature: '0xsig',
        issuedAt: '2026-09-04T12:34:56.000Z',
      })
      expect(signMessage).toHaveBeenCalledWith(
        buildPolicyMessage({ chainId, safeAddress, issuedAt: '2026-09-04T12:34:56.000Z', policy }),
      )
    })

    it('propagates a rejected signature', async () => {
      const signMessage = jest.fn().mockRejectedValue(new Error('User rejected'))

      await expect(signPolicyUpdate({ chainId, safeAddress, policy, signMessage })).rejects.toThrow('User rejected')
    })
  })
})
