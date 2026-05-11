import { useMemo } from 'react'
import { isAddress } from 'ethers'
import Identicon from '@/components/common/Identicon'
import EthHashInfo from '@/components/common/EthHashInfo'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import type { AddressBookEntry } from './SpaceAddressBookTable'

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  const timeStr = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

  if (date.toDateString() === now.toDateString()) {
    return `Today at ${timeStr}`
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${timeStr}`
  }
  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${timeStr}`
}

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

function ActorAvatar({ actor }: { actor: ActivityActor }) {
  return actor.isWalletAddress ? (
    <Identicon address={actor.value} size={32} />
  ) : (
    <InitialsAvatar name={actor.value} size="medium" rounded />
  )
}

function ActorName({ actor }: { actor: ActivityActor }) {
  if (!actor.isWalletAddress) {
    return <span className="min-w-0 font-bold break-all">{actor.value}</span>
  }

  return (
    <span className="inline-flex font-bold [&>div]:inline-flex [&>div]:items-center">
      <EthHashInfo address={actor.value} showAvatar={false} onlyName showPrefix={false} showCopyButton={false} />
    </span>
  )
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
            <ActorAvatar actor={event.actor} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-1 text-sm">
              <ActorName actor={event.actor} />
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
