import { useMemo } from 'react'
import { isAddress } from 'ethers'
import { ActorAvatar, ActorName } from '../SpaceActivityLog/AuditEventRow'
import { formatDate } from '@/features/spaces/utils'
import type { AddressBookEntry } from './SpaceAddressBookTable'

type ActivityActor = {
  value: string
  isWalletAddress: boolean
}

export type ActivityEvent = {
  type: 'added' | 'updated'
  entry: AddressBookEntry
  date: string
  actor: ActivityActor
}

function buildActivityActor(actor: string): ActivityActor {
  return {
    value: actor,
    isWalletAddress: isAddress(actor),
  }
}

export function buildActivityEvents(entries: AddressBookEntry[]): ActivityEvent[] {
  const events: ActivityEvent[] = []

  for (const entry of entries) {
    if (entry.createdAt) {
      events.push({
        type: 'added',
        entry,
        date: entry.createdAt,
        actor: buildActivityActor(entry.createdBy),
      })
    }
    if (entry.updatedAt && entry.createdAt && entry.updatedAt !== entry.createdAt) {
      events.push({
        type: 'updated',
        entry,
        date: entry.updatedAt,
        actor: buildActivityActor(entry.lastUpdatedBy),
      })
    }
  }

  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function ActivityLog({ entries }: { entries: AddressBookEntry[] }) {
  const events = useMemo(() => buildActivityEvents(entries), [entries])

  if (events.length === 0) {
    return <p className="text-muted-foreground text-sm">No activity yet.</p>
  }

  return (
    <div className="divide-y">
      {events.map((event, i) => (
        <div key={`${event.entry.address}-${event.type}-${i}`} className="flex items-start gap-3 py-3">
          <div className="shrink-0 pt-0.5">
            <ActorAvatar actor={event.actor.value} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-1 text-sm">
              <ActorName actor={event.actor.value} />
              <span>{event.type}</span>
              <span className="font-bold">{event.entry.name}</span>
            </p>

            <p className="text-muted-foreground mt-0.5 text-xs">{formatDate(event.date)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ActivityLog
