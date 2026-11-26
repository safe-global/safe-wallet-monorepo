import type { Policy } from '@safe-global/views/features/spaces/components/Policies/types'
import {
  mockActiveAllowlist,
  mockAllowlistAwaitingGuardRemoval,
  mockPendingAllowlist,
} from '../../../../public/utils/allowlistPolicies'
import { isAllowlistChangeServed } from '../allowlistChangeServed'

const ROOT = '0x1111111111111111111111111111111111111111111111111111111111111111'

describe('isAllowlistChangeServed', () => {
  it('should, when an executed setup has no live allowlist yet, say it is not served', () => {
    const setup = mockPendingAllowlist({ appliesOnExecution: true })

    expect(isAllowlistChangeServed(setup, [])).toBe(false)
  })

  it('should, when an executed setup shows as a live allowlist of its Safe, say it is served', () => {
    const live = mockActiveAllowlist()
    const setup = mockPendingAllowlist({ appliesOnExecution: true, safe: live.safe })

    expect(isAllowlistChangeServed(setup, [live])).toBe(true)
  })

  it('should, when the row of an executed request shows no waiting change yet, say it is not served', () => {
    const live = mockActiveAllowlist()
    const request = mockPendingAllowlist({ id: live.id, safe: live.safe, step: 'request', root: ROOT })

    expect(isAllowlistChangeServed(request, [live])).toBe(false)
  })

  it('should, when the row of an executed request waits out the delay of its root, say it is served', () => {
    const live = mockActiveAllowlist()
    const request = mockPendingAllowlist({ id: live.id, safe: live.safe, step: 'request', root: ROOT })
    const inDelay: Policy = { ...live, scheduledChange: { operation: 'update', appliesAt: 1_800_000_000, root: ROOT } }

    expect(isAllowlistChangeServed(request, [inDelay])).toBe(true)
  })

  it('should, when the row of an executed apply still offers to apply its root, say it is not served', () => {
    const live = mockActiveAllowlist()
    const apply = mockPendingAllowlist({ id: live.id, safe: live.safe, step: 'apply', root: ROOT })
    const readyToApply: Policy = {
      ...live,
      scheduledChange: { operation: 'update', appliesAt: 1_700_000_000, root: ROOT },
    }

    expect(isAllowlistChangeServed(apply, [readyToApply])).toBe(false)
  })

  it('should, when the row of an executed apply no longer names its root, say it is served', () => {
    const live = mockActiveAllowlist()
    const apply = mockPendingAllowlist({ id: live.id, safe: live.safe, step: 'apply', root: ROOT })

    expect(isAllowlistChangeServed(apply, [live])).toBe(true)
  })

  it('should, when the row of an executed guard removal still waits for the guard to come off, say it is not served', () => {
    const awaiting = mockAllowlistAwaitingGuardRemoval()
    const guardRemoval = mockPendingAllowlist({ id: awaiting.id, safe: awaiting.safe, step: 'remove-guard' })

    expect(isAllowlistChangeServed(guardRemoval, [awaiting])).toBe(false)
  })

  it('should, when the Safe of an executed guard removal has no allowlist left, say it is served', () => {
    const guardRemoval = mockPendingAllowlist({ step: 'remove-guard' })

    expect(isAllowlistChangeServed(guardRemoval, [])).toBe(true)
  })
})
