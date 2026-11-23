import {
  mockActiveAllowlist,
  mockAllowlistAwaitingGuardRemoval,
  mockPendingAllowlist,
  mockUnenforcedAllowlist,
} from '../../../../public/utils/allowlistPolicies'
import { getAllowlistStatus } from '../allowlistStatus'

const NOW_SECONDS = 1_800_000_000
const NOW_MS = NOW_SECONDS * 1_000
const HOUR = 3_600
const DAY = 24 * HOUR

describe('getAllowlistStatus', () => {
  it('should, when a setup waits for signatures, read setup pending with the signatures it has', () => {
    const setup = mockPendingAllowlist({
      appliesOnExecution: true,
      confirmationsSubmitted: 1,
      confirmationsRequired: 2,
    })

    const status = getAllowlistStatus(setup, NOW_MS)

    expect(status).toEqual({
      state: 'setup-pending',
      label: 'Setup pending · 1/2',
      variant: 'warning',
      tooltip: 'Waiting for signatures: 1 of 2.',
    })
  })

  it('should, when a setup has every signature, read setup ready to execute', () => {
    const setup = mockPendingAllowlist({
      appliesOnExecution: true,
      confirmationsSubmitted: 2,
      confirmationsRequired: 2,
    })

    const status = getAllowlistStatus(setup, NOW_MS)

    expect(status).toEqual({
      state: 'setup-ready-to-execute',
      label: 'Setup ready to execute',
      variant: 'info',
      tooltip: 'All signatures are in. Waiting for execution.',
    })
  })

  it('should, when no change waits, read active with no tooltip', () => {
    const status = getAllowlistStatus(mockActiveAllowlist(), NOW_MS)

    expect(status).toEqual({ state: 'active', label: 'Active', variant: 'success', tooltip: undefined })
  })

  it('should, when the guard is not in the transaction slot, read not enforced', () => {
    const status = getAllowlistStatus(mockUnenforcedAllowlist(), NOW_MS)

    expect(status).toMatchObject({ state: 'unenforced', label: 'Not enforced', variant: 'secondary' })
  })

  it('should, when the request of an edit waits for signatures, read edit pending', () => {
    const edit = mockPendingAllowlist({
      operation: 'update',
      step: 'request',
      confirmationsSubmitted: 1,
      confirmationsRequired: 2,
    })

    const status = getAllowlistStatus(edit, NOW_MS)

    expect(status).toMatchObject({ state: 'edit-pending', label: 'Edit pending · 1/2', variant: 'warning' })
  })

  it('should, when the request of an edit has every signature, read edit ready to execute', () => {
    const edit = mockPendingAllowlist({
      operation: 'update',
      step: 'request',
      confirmationsSubmitted: 2,
      confirmationsRequired: 2,
    })

    const status = getAllowlistStatus(edit, NOW_MS)

    expect(status).toMatchObject({ state: 'edit-ready-to-execute', label: 'Edit ready to execute', variant: 'info' })
  })

  it('should, when an edit waits out the delay, read edit in delay and say from when and until when it can be applied', () => {
    const edit = {
      ...mockActiveAllowlist(),
      scheduledChange: { operation: 'update', appliesAt: NOW_SECONDS + HOUR, expiresAt: NOW_SECONDS + 7 * DAY },
    } as const

    const status = getAllowlistStatus(edit, NOW_MS)

    expect(status).toEqual({
      state: 'edit-in-delay',
      label: 'Edit in delay',
      variant: 'warning',
      tooltip: 'Can be applied in 1 hour, from Jan 15, 09:00 UTC. Expires on Jan 22, 08:00 UTC.',
    })
  })

  it('should, when the delay of an edit is over, read edit ready to apply and say that nothing happens by itself', () => {
    const edit = {
      ...mockActiveAllowlist(),
      scheduledChange: { operation: 'update', appliesAt: NOW_SECONDS - HOUR, expiresAt: NOW_SECONDS + 6 * DAY },
    } as const

    const status = getAllowlistStatus(edit, NOW_MS)

    expect(status).toEqual({
      state: 'edit-ready-to-apply',
      label: 'Edit ready to apply',
      variant: 'info',
      tooltip: 'A signer must apply it by Jan 21, 08:00 UTC. Nothing happens by itself.',
    })
  })

  it('should, when the apply of an edit waits for signatures, read edit apply pending and say until when to execute it', () => {
    const edit = mockPendingAllowlist({
      operation: 'update',
      step: 'apply',
      confirmationsSubmitted: 1,
      confirmationsRequired: 2,
      expiresAt: NOW_SECONDS + 6 * DAY,
    })

    const status = getAllowlistStatus(edit, NOW_MS)

    expect(status).toEqual({
      state: 'edit-apply-pending',
      label: 'Edit apply pending · 1/2',
      variant: 'warning',
      tooltip: 'Waiting for signatures: 1 of 2. Execute it by Jan 21, 08:00 UTC.',
    })
  })

  it('should, when the apply of an edit has every signature, read edit apply ready to execute', () => {
    const edit = mockPendingAllowlist({
      operation: 'update',
      step: 'apply',
      confirmationsSubmitted: 2,
      confirmationsRequired: 2,
    })

    const status = getAllowlistStatus(edit, NOW_MS)

    expect(status).toMatchObject({
      state: 'edit-apply-ready-to-execute',
      label: 'Edit apply ready to execute',
      variant: 'info',
    })
  })

  it('should, when an edit was not applied in time, read edit expired and say the current rules stay', () => {
    const edit = {
      ...mockActiveAllowlist(),
      scheduledChange: { operation: 'update', appliesAt: NOW_SECONDS - 8 * DAY, expiresAt: NOW_SECONDS - DAY },
    } as const

    const status = getAllowlistStatus(edit, NOW_MS)

    expect(status).toEqual({
      state: 'edit-expired',
      label: 'Edit expired',
      variant: 'secondary',
      tooltip: 'It was not applied in time. The current rules stay in force.',
    })
  })

  it('should, when the request of a removal waits for signatures, read removal pending', () => {
    const removal = mockPendingAllowlist({
      operation: 'remove',
      step: 'request',
      confirmationsSubmitted: 1,
      confirmationsRequired: 3,
    })

    const status = getAllowlistStatus(removal, NOW_MS)

    expect(status).toMatchObject({ state: 'removal-pending', label: 'Removal pending · 1/3', variant: 'warning' })
  })

  it('should, when the request of a removal has every signature, read removal ready to execute', () => {
    const removal = mockPendingAllowlist({
      operation: 'remove',
      step: 'request',
      confirmationsSubmitted: 2,
      confirmationsRequired: 2,
    })

    const status = getAllowlistStatus(removal, NOW_MS)

    expect(status).toMatchObject({ state: 'removal-ready-to-execute', label: 'Removal ready to execute' })
  })

  it('should, when a removal waits out the delay, read removal in delay', () => {
    const removal = {
      ...mockActiveAllowlist(),
      scheduledChange: { operation: 'remove', appliesAt: NOW_SECONDS + HOUR, expiresAt: NOW_SECONDS + 7 * DAY },
    } as const

    const status = getAllowlistStatus(removal, NOW_MS)

    expect(status).toMatchObject({ state: 'removal-in-delay', label: 'Removal in delay', variant: 'warning' })
  })

  it('should, when the delay of a removal is over, read removal ready to apply', () => {
    const removal = {
      ...mockActiveAllowlist(),
      scheduledChange: { operation: 'remove', appliesAt: NOW_SECONDS - HOUR, expiresAt: NOW_SECONDS + 6 * DAY },
    } as const

    const status = getAllowlistStatus(removal, NOW_MS)

    expect(status).toMatchObject({ state: 'removal-ready-to-apply', label: 'Removal ready to apply', variant: 'info' })
  })

  it('should, when the apply of a removal waits for signatures, read removal apply pending', () => {
    const removal = mockPendingAllowlist({
      operation: 'remove',
      step: 'apply',
      confirmationsSubmitted: 0,
      confirmationsRequired: 2,
    })

    const status = getAllowlistStatus(removal, NOW_MS)

    expect(status).toMatchObject({ state: 'removal-apply-pending', label: 'Removal apply pending · 0/2' })
  })

  it('should, when the apply of a removal has every signature, read removal apply ready to execute', () => {
    const removal = mockPendingAllowlist({
      operation: 'remove',
      step: 'apply',
      confirmationsSubmitted: 2,
      confirmationsRequired: 2,
    })

    const status = getAllowlistStatus(removal, NOW_MS)

    expect(status).toMatchObject({ state: 'removal-apply-ready-to-execute', label: 'Removal apply ready to execute' })
  })

  it('should, when a removal was not applied in time, read removal expired', () => {
    const removal = {
      ...mockActiveAllowlist(),
      scheduledChange: { operation: 'remove', appliesAt: NOW_SECONDS - 8 * DAY, expiresAt: NOW_SECONDS - DAY },
    } as const

    const status = getAllowlistStatus(removal, NOW_MS)

    expect(status).toMatchObject({ state: 'removal-expired', label: 'Removal expired', variant: 'secondary' })
  })

  it("should, when the applied removal waits for the guard to come off, read guard removal pending with none of the Safe's signatures", () => {
    const status = getAllowlistStatus(mockAllowlistAwaitingGuardRemoval(), NOW_MS, 2)

    expect(status).toEqual({
      state: 'guard-removal-pending',
      label: 'Guard removal pending · 0/2',
      variant: 'warning',
      tooltip: "Waiting for a signer to remove the guard. Until then, this Safe account can't send anything.",
    })
  })

  it("should, when the Safe's threshold is not known yet, read guard removal pending without signatures", () => {
    const status = getAllowlistStatus(mockAllowlistAwaitingGuardRemoval(), NOW_MS)

    expect(status.label).toBe('Guard removal pending')
  })

  it('should, when the guard removal waits for signatures, read guard removal pending with the signatures it has', () => {
    const guardRemoval = mockPendingAllowlist({
      operation: 'remove',
      step: 'remove-guard',
      confirmationsSubmitted: 1,
      confirmationsRequired: 2,
    })

    const status = getAllowlistStatus(guardRemoval, NOW_MS)

    expect(status).toMatchObject({ state: 'guard-removal-pending', label: 'Guard removal pending · 1/2' })
  })

  it('should, when the guard removal has every signature, read guard removal ready to execute', () => {
    const guardRemoval = mockPendingAllowlist({
      operation: 'remove',
      step: 'remove-guard',
      confirmationsSubmitted: 2,
      confirmationsRequired: 2,
    })

    const status = getAllowlistStatus(guardRemoval, NOW_MS)

    expect(status).toMatchObject({
      state: 'guard-removal-ready-to-execute',
      label: 'Guard removal ready to execute',
      variant: 'info',
    })
  })

  it('should, when an executed transaction is not served yet, read processing', () => {
    const executed = { ...mockPendingAllowlist({ operation: 'update', step: 'apply' }), status: 'activating' } as const

    const status = getAllowlistStatus(executed, NOW_MS)

    expect(status).toEqual({
      state: 'processing',
      label: 'Processing',
      variant: 'warning',
      tooltip: 'The transaction is executed. It can take a moment to show here.',
    })
  })
})
