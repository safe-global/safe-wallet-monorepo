import type { QueueStatusOption } from '@safe-global/views/features/spaces/components/SpaceQueue/types'

export const STATUS_OPTION_LABELS: Record<QueueStatusOption, { menu: string; chip: string }> = {
  execute: { menu: 'Execute', chip: 'Ready to execute' },
  sign: { menu: 'Sign', chip: 'Ready to sign' },
  blocked: { menu: 'Blocked', chip: 'Blocked' },
  waiting: { menu: 'Waiting', chip: 'Waiting on others' },
  conflicting: { menu: 'Conflicting', chip: 'Conflicting' },
  stale: { menu: 'Stale 7 days', chip: 'Stale 7 days' },
}
