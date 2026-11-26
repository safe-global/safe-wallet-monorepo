import { faker } from '@faker-js/faker'
import type { PendingGuardInstallationDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { mockAllowlistAwaitingGuardRemoval } from '../../../../public/utils/allowlistPolicies'
import { mergeGuardRemovals } from '../mapGuardRemovals'

const queuedTransaction = (): PendingGuardInstallationDto['transaction'] => ({
  safeTxHash: faker.string.hexadecimal({ length: 64, casing: 'lower' }),
  nonce: 7,
  confirmations: 1,
  confirmationsRequired: 2,
  proposedAt: 1_800_000_000,
  proposer: null,
})

describe('mergeGuardRemovals', () => {
  it("should, when a queued transaction clears both guard slots, show it on the row of the Safe's allowlist", () => {
    const awaiting = mockAllowlistAwaitingGuardRemoval()
    const transaction = queuedTransaction()
    const guardRemoval: PendingGuardInstallationDto = {
      kind: 'guard-installation',
      status: 'in-signing',
      safe: awaiting.safe,
      changes: [
        { kind: 'set-guard', from: faker.finance.ethereumAddress(), to: null },
        { kind: 'set-module-guard', from: faker.finance.ethereumAddress(), to: null },
      ],
      transaction,
    }

    const policies = mergeGuardRemovals([guardRemoval], [awaiting])

    expect(policies).toEqual([
      {
        id: awaiting.id,
        type: 'allowlist',
        safe: awaiting.safe,
        enforcement: awaiting.enforcement,
        enabled: awaiting.enabled,
        data: awaiting.data,
        status: 'pending',
        operation: 'remove',
        step: 'remove-guard',
        safeTxHash: transaction.safeTxHash,
        nonce: 7,
        confirmationsSubmitted: 1,
        confirmationsRequired: 2,
        proposedAt: 1_800_000_000,
      },
    ])
  })

  it('should, when a queued transaction only clears the transaction guard, leave the row as it is', () => {
    const awaiting = mockAllowlistAwaitingGuardRemoval()
    const guardChange: PendingGuardInstallationDto = {
      kind: 'guard-installation',
      status: 'ready',
      safe: awaiting.safe,
      changes: [{ kind: 'set-guard', from: faker.finance.ethereumAddress(), to: null }],
      transaction: queuedTransaction(),
    }

    const policies = mergeGuardRemovals([guardChange], [awaiting])

    expect(policies).toEqual([awaiting])
  })

  it('should, when the guard removal is queued on another Safe, leave the row as it is', () => {
    const awaiting = mockAllowlistAwaitingGuardRemoval()
    const guardRemoval: PendingGuardInstallationDto = {
      kind: 'guard-installation',
      status: 'in-signing',
      safe: { chainId: awaiting.safe.chainId, address: faker.finance.ethereumAddress() },
      changes: [
        { kind: 'set-guard', from: faker.finance.ethereumAddress(), to: null },
        { kind: 'set-module-guard', from: faker.finance.ethereumAddress(), to: null },
      ],
      transaction: queuedTransaction(),
    }

    const policies = mergeGuardRemovals([guardRemoval], [awaiting])

    expect(policies).toEqual([awaiting])
  })
})
