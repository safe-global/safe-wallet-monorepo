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
  it('should, when a setup waits for signatures, read setup and pending with the signatures it has', () => {
    const setup = mockPendingAllowlist({
      appliesOnExecution: true,
      confirmationsSubmitted: 1,
      confirmationsRequired: 2,
    })

    const status = getAllowlistStatus(setup, NOW_MS)

    expect(status).toEqual({
      state: 'setup-pending',
      change: 'setup',
      label: 'Pending · 1/2',
      variant: 'warning',
      tooltip: 'Waiting for signatures: 1 of 2.',
    })
  })

  it('should, when a setup has every signature, read setup and ready to execute', () => {
    const setup = mockPendingAllowlist({
      appliesOnExecution: true,
      confirmationsSubmitted: 2,
      confirmationsRequired: 2,
    })

    const status = getAllowlistStatus(setup, NOW_MS)

    expect(status).toEqual({
      state: 'setup-ready-to-execute',
      change: 'setup',
      label: 'Ready to execute',
      variant: 'info',
      tooltip: 'All signatures are in. Waiting for execution.',
    })
  })

  it('should, when no change waits, read active alone with no tooltip', () => {
    const status = getAllowlistStatus(mockActiveAllowlist(), NOW_MS)

    expect(status).toStrictEqual({
      state: 'active',
      change: undefined,
      label: 'Active',
      variant: 'success',
      tooltip: undefined,
    })
  })

  it('should, when the guard is not in the transaction slot, read not enforced', () => {
    const status = getAllowlistStatus(mockUnenforcedAllowlist(), NOW_MS)

    expect(status).toMatchObject({ state: 'unenforced', label: 'Not enforced', variant: 'secondary' })
    expect(status.change).toBeUndefined()
  })

  it('should, when the request of an edit waits for signatures, read edit and pending', () => {
    const edit = mockPendingAllowlist({
      operation: 'update',
      step: 'request',
      confirmationsSubmitted: 1,
      confirmationsRequired: 2,
    })

    const status = getAllowlistStatus(edit, NOW_MS)

    expect(status).toMatchObject({ state: 'edit-pending', change: 'edit', label: 'Pending · 1/2', variant: 'warning' })
  })

  it('should, when the request of an edit has every signature, read edit and ready to execute', () => {
    const edit = mockPendingAllowlist({
      operation: 'update',
      step: 'request',
      confirmationsSubmitted: 2,
      confirmationsRequired: 2,
    })

    const status = getAllowlistStatus(edit, NOW_MS)

    expect(status).toMatchObject({
      state: 'edit-ready-to-execute',
      change: 'edit',
      label: 'Ready to execute',
      variant: 'info',
    })
  })

  it('should, when an edit waits out the delay, read edit and in delay and say from when and until when it can be applied', () => {
    const edit = {
      ...mockActiveAllowlist(),
      scheduledChange: { operation: 'update', appliesAt: NOW_SECONDS + HOUR, expiresAt: NOW_SECONDS + 7 * DAY },
    } as const

    const status = getAllowlistStatus(edit, NOW_MS)

    expect(status).toEqual({
      state: 'edit-in-delay',
      change: 'edit',
      label: 'In delay',
      variant: 'warning',
      tooltip: 'Can be applied in 1 hour, from Jan 15, 09:00 UTC. Expires on Jan 22, 08:00 UTC.',
    })
  })

  it('should, when the delay of an edit is over, read edit and ready to apply and say that nothing happens by itself', () => {
    const edit = {
      ...mockActiveAllowlist(),
      scheduledChange: { operation: 'update', appliesAt: NOW_SECONDS - HOUR, expiresAt: NOW_SECONDS + 6 * DAY },
    } as const

    const status = getAllowlistStatus(edit, NOW_MS)

    expect(status).toEqual({
      state: 'edit-ready-to-apply',
      change: 'edit',
      label: 'Ready to apply',
      variant: 'info',
      tooltip: 'A signer must apply it by Jan 21, 08:00 UTC. Nothing happens by itself.',
    })
  })

  it('should, when the apply of an edit waits for signatures, read edit and apply pending and say until when to execute it', () => {
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
      change: 'edit',
      label: 'Apply pending · 1/2',
      variant: 'warning',
      tooltip: 'Waiting for signatures: 1 of 2. Execute it by Jan 21, 08:00 UTC.',
    })
  })

  it('should, when the apply of an edit has every signature, read edit and apply ready to execute', () => {
    const edit = mockPendingAllowlist({
      operation: 'update',
      step: 'apply',
      confirmationsSubmitted: 2,
      confirmationsRequired: 2,
    })

    const status = getAllowlistStatus(edit, NOW_MS)

    expect(status).toMatchObject({
      state: 'edit-apply-ready-to-execute',
      change: 'edit',
      label: 'Apply ready to execute',
      variant: 'info',
    })
  })

  it('should, when an edit was not applied in time, read edit and expired and say the current rules stay', () => {
    const edit = {
      ...mockActiveAllowlist(),
      scheduledChange: { operation: 'update', appliesAt: NOW_SECONDS - 8 * DAY, expiresAt: NOW_SECONDS - DAY },
    } as const

    const status = getAllowlistStatus(edit, NOW_MS)

    expect(status).toEqual({
      state: 'edit-expired',
      change: 'edit',
      label: 'Expired',
      variant: 'secondary',
      tooltip: 'It was not applied in time. The current rules stay in force.',
    })
  })

  it('should, when the request of a removal waits for signatures, read removal and pending', () => {
    const removal = mockPendingAllowlist({
      operation: 'remove',
      step: 'request',
      confirmationsSubmitted: 1,
      confirmationsRequired: 3,
    })

    const status = getAllowlistStatus(removal, NOW_MS)

    expect(status).toMatchObject({
      state: 'removal-pending',
      change: 'removal',
      label: 'Pending · 1/3',
      variant: 'warning',
    })
  })

  it('should, when the request of a removal has every signature, read removal and ready to execute', () => {
    const removal = mockPendingAllowlist({
      operation: 'remove',
      step: 'request',
      confirmationsSubmitted: 2,
      confirmationsRequired: 2,
    })

    const status = getAllowlistStatus(removal, NOW_MS)

    expect(status).toMatchObject({ state: 'removal-ready-to-execute', change: 'removal', label: 'Ready to execute' })
  })

  it('should, when a removal waits out the delay, read removal and in delay', () => {
    const removal = {
      ...mockActiveAllowlist(),
      scheduledChange: { operation: 'remove', appliesAt: NOW_SECONDS + HOUR, expiresAt: NOW_SECONDS + 7 * DAY },
    } as const

    const status = getAllowlistStatus(removal, NOW_MS)

    expect(status).toMatchObject({
      state: 'removal-in-delay',
      change: 'removal',
      label: 'In delay',
      variant: 'warning',
    })
  })

  it('should, when the delay of a removal is over, read removal and ready to apply', () => {
    const removal = {
      ...mockActiveAllowlist(),
      scheduledChange: { operation: 'remove', appliesAt: NOW_SECONDS - HOUR, expiresAt: NOW_SECONDS + 6 * DAY },
    } as const

    const status = getAllowlistStatus(removal, NOW_MS)

    expect(status).toMatchObject({
      state: 'removal-ready-to-apply',
      change: 'removal',
      label: 'Ready to apply',
      variant: 'info',
    })
  })

  it('should, when the apply of a removal waits for signatures, read removal and apply pending', () => {
    const removal = mockPendingAllowlist({
      operation: 'remove',
      step: 'apply',
      confirmationsSubmitted: 0,
      confirmationsRequired: 2,
    })

    const status = getAllowlistStatus(removal, NOW_MS)

    expect(status).toMatchObject({ state: 'removal-apply-pending', change: 'removal', label: 'Apply pending · 0/2' })
  })

  it('should, when the apply of a removal has every signature, read removal and apply ready to execute', () => {
    const removal = mockPendingAllowlist({
      operation: 'remove',
      step: 'apply',
      confirmationsSubmitted: 2,
      confirmationsRequired: 2,
    })

    const status = getAllowlistStatus(removal, NOW_MS)

    expect(status).toMatchObject({
      state: 'removal-apply-ready-to-execute',
      change: 'removal',
      label: 'Apply ready to execute',
    })
  })

  it('should, when a removal was not applied in time, read removal and expired', () => {
    const removal = {
      ...mockActiveAllowlist(),
      scheduledChange: { operation: 'remove', appliesAt: NOW_SECONDS - 8 * DAY, expiresAt: NOW_SECONDS - DAY },
    } as const

    const status = getAllowlistStatus(removal, NOW_MS)

    expect(status).toMatchObject({
      state: 'removal-expired',
      change: 'removal',
      label: 'Expired',
      variant: 'secondary',
    })
  })

  it("should, when the applied removal waits for the guard to come off, read guard removal and pending with none of the Safe's signatures", () => {
    const status = getAllowlistStatus(mockAllowlistAwaitingGuardRemoval(), NOW_MS, 2)

    expect(status).toEqual({
      state: 'guard-removal-pending',
      change: 'guard-removal',
      label: 'Pending · 0/2',
      variant: 'warning',
      tooltip: "Waiting for a signer to remove the guard. Until then, this Safe account can't send anything.",
    })
  })

  it("should, when the Safe's threshold is not known yet, read guard removal and pending without signatures", () => {
    const status = getAllowlistStatus(mockAllowlistAwaitingGuardRemoval(), NOW_MS)

    expect(status).toMatchObject({ change: 'guard-removal', label: 'Pending' })
  })

  it('should, when the guard removal waits for signatures, read guard removal and pending with the signatures it has', () => {
    const guardRemoval = mockPendingAllowlist({
      operation: 'remove',
      step: 'remove-guard',
      confirmationsSubmitted: 1,
      confirmationsRequired: 2,
    })

    const status = getAllowlistStatus(guardRemoval, NOW_MS)

    expect(status).toMatchObject({ state: 'guard-removal-pending', change: 'guard-removal', label: 'Pending · 1/2' })
  })

  it('should, when the guard removal has every signature, read guard removal and ready to execute', () => {
    const guardRemoval = mockPendingAllowlist({
      operation: 'remove',
      step: 'remove-guard',
      confirmationsSubmitted: 2,
      confirmationsRequired: 2,
    })

    const status = getAllowlistStatus(guardRemoval, NOW_MS)

    expect(status).toMatchObject({
      state: 'guard-removal-ready-to-execute',
      change: 'guard-removal',
      label: 'Ready to execute',
      variant: 'info',
    })
  })

  it('should, when the executed apply of an edit is not served yet, read edit and processing', () => {
    const executed = { ...mockPendingAllowlist({ operation: 'update', step: 'apply' }), status: 'activating' } as const

    const status = getAllowlistStatus(executed, NOW_MS)

    expect(status).toEqual({
      state: 'processing',
      change: 'edit',
      label: 'Processing',
      variant: 'warning',
      tooltip: 'The transaction is executed. It can take a moment to show here.',
    })
  })

  it('should, when an executed setup is not served yet, read setup and processing', () => {
    const executed = { ...mockPendingAllowlist({ appliesOnExecution: true }), status: 'activating' } as const

    const status = getAllowlistStatus(executed, NOW_MS)

    expect(status).toMatchObject({ state: 'processing', change: 'setup', label: 'Processing' })
  })

  it('should, when the setup transaction failed, read setup and failed', () => {
    const failed = { ...mockPendingAllowlist({ appliesOnExecution: true }), status: 'failed' } as const

    const status = getAllowlistStatus(failed, NOW_MS)

    expect(status).toMatchObject({ state: 'failed', change: 'setup', label: 'Failed', variant: 'destructive' })
  })
})
