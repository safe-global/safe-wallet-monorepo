// Prototype fixtures for production's RecoveryQueueItem (features/recovery/services/recovery-state.ts).

export type RecoveryState = 'review' | 'executable' | 'cancelling' | 'executed' | 'expired'

export type Recovery = {
  id: string
  accountId: string
  newSigners: string[]
  threshold: number
  recoverer: { name: string; address: string }
  module: string
  data: string
  malicious: boolean
  // Malicious: calls another contract. It does not change this Safe's signers.
  maliciousTarget?: string
  proposedAt: number
  executableAt: number
  expiresAt: number
  state: RecoveryState
}

const HOUR = 3_600_000
const DAY = 24 * HOUR

// The three recoveries go on the given Safes, the everyday three by default.
export const createRecoveries = (
  now = Date.now(),
  [first, second, third]: string[] = ['treasury', 'payroll', 'grants'],
): Recovery[] => [
  {
    id: `${first}-recovery`,
    accountId: first,
    newSigners: ['0x9f2c000000000000000000000000000000002ab0', '0x44de00000000000000000000000000000000c0e1'],
    threshold: 2,
    recoverer: { name: 'Recovery partner', address: '0x7a3e0000000000000000000000000000000091c4' },
    module: '0xd1a000000000000000000000000000000000ff21',
    data: `0x6a761202${'00'.repeat(60)}`,
    malicious: false,
    proposedAt: now - 1 * DAY - 20 * HOUR,
    executableAt: now + 2 * DAY + 4 * HOUR,
    expiresAt: now + 32 * DAY,
    state: 'review',
  },
  {
    id: `${second}-recovery`,
    accountId: second,
    newSigners: ['0x51b0000000000000000000000000000000003e77'],
    threshold: 1,
    recoverer: { name: 'Unknown recoverer', address: '0xbad0000000000000000000000000000000000ffe' },
    module: '0xe2b100000000000000000000000000000000ee32',
    data: `0x8d80ff0a${'00'.repeat(60)}`,
    malicious: true,
    maliciousTarget: '0xbad0…0ffe',
    proposedAt: now - 6 * HOUR,
    executableAt: now + 2 * DAY + 18 * HOUR,
    expiresAt: now + 33 * DAY,
    state: 'review',
  },
  {
    id: `${third}-recovery`,
    accountId: third,
    newSigners: ['0x2c1800000000000000000000000000000000aa02', '0x6f30000000000000000000000000000000005d19'],
    threshold: 2,
    recoverer: { name: 'Lena (backup wallet)', address: '0x2c1800000000000000000000000000000000aa02' },
    module: '0xf3c200000000000000000000000000000000ff43',
    data: `0x6a761202${'00'.repeat(60)}`,
    malicious: false,
    proposedAt: now - 4 * DAY,
    executableAt: now - 1 * DAY,
    expiresAt: now + 5 * DAY,
    state: 'executable',
  },
]

export const formatDuration = (ms: number) => {
  const minutes = Math.max(0, Math.round(ms / 60_000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  if (days) return hours ? `${days}d ${hours}h` : `${days}d`
  return hours ? `${hours}h` : `${minutes % 60}m`
}

export const shortHex = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`

export const getRecoveryHeadline = (recovery: Recovery) =>
  recovery.malicious ? `Call ${recovery.maliciousTarget}` : 'Replace signers'

export const STATUS: Record<
  Exclude<RecoveryState, 'executed'>,
  { label: string; tone: 'warning' | 'success' | 'destructive' | 'secondary'; hint: string }
> = {
  review: {
    label: 'In review',
    tone: 'warning',
    hint: 'Signers can cancel it any time before it executes. Once the review window ends, anyone can execute it.',
  },
  executable: {
    label: 'Ready to execute',
    tone: 'success',
    hint: 'The review window has ended. Anyone can execute it until it expires; signers can still cancel it first.',
  },
  cancelling: {
    label: 'Cancellation pending',
    tone: 'warning',
    hint: 'A cancellation transaction is in the queue. It needs signatures and execution before the recovery executes.',
  },
  expired: {
    label: 'Expired',
    tone: 'secondary',
    hint: 'It can no longer execute. Anyone can clear it from the queue.',
  },
}

export const getRecoveryStatus = (recovery: Recovery) =>
  recovery.malicious && recovery.state !== 'cancelling'
    ? {
        label: 'Malicious',
        tone: 'destructive' as const,
        hint: "It doesn't change this Safe's signers. It calls another contract instead. Cancel it.",
      }
    : STATUS[recovery.state as keyof typeof STATUS]
