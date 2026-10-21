import type { ReactNode } from 'react'
import { Bell, ChevronRight, Filter, UserPlus } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import Identicon from '@/components/common/Identicon'
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerList,
  DrawerSection,
  DrawerTitle,
} from '@/components/common/Drawer'
import { getAccount, getTransactionLabel, shortAddress } from '../../services/model'
import type { MemberProfile } from '../../services/members'
import type { Account, Persona, Proposal } from '../../types'
import { canInvite } from '../../services/personas'
import { IdentityRow } from '../ReviewDrawer/steps/IdentityRow'

function LinkRow({ title, detail, onClick }: { title: ReactNode; detail: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{detail}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={ICON_STROKE} aria-hidden="true" />
    </button>
  )
}

function TxList({ txs, empty, onOpenTx }: { txs: Proposal[]; empty: string; onOpenTx: (tx: Proposal) => void }) {
  if (!txs.length) return <p className="px-2 text-sm text-muted-foreground">{empty}</p>
  return (
    <div className="flex flex-col">
      {txs.map((tx) => (
        <LinkRow
          key={tx.id}
          title={getTransactionLabel(tx)}
          detail={`${getAccount(tx).name} · #${tx.nonce} · ${tx.age}`}
          onClick={() => onOpenTx(tx)}
        />
      ))}
    </div>
  )
}

// Fleet admin: everything about one team member, with links into the queue.
export function MemberDrawer({
  member,
  persona,
  onClose,
  onOpenTx,
  onOpenSafe,
  onShowInQueue,
  onRemind,
  onInvite,
}: {
  member: MemberProfile | null
  persona: Persona
  onClose: () => void
  onOpenTx: (tx: Proposal) => void
  onOpenSafe: (account: Account) => void
  onShowInQueue: (id: string) => void
  onRemind: (member: MemberProfile) => void
  onInvite: (member: MemberProfile) => void
}) {
  const outside = member?.access === 'Not in workspace'
  return (
    <Drawer resizable mobileFullScreen open={!!member} onClose={onClose} ariaLabel="Team member">
      <DrawerHeader>
        {member && (
          <div className="flex min-w-0 flex-1 items-center gap-3 pr-18">
            <span className="flex shrink-0">
              <Identicon address={member.address} size={40} />
            </span>
            <span className="min-w-0">
              <DrawerTitle size="lg">{member.name}</DrawerTitle>
              <span className="mt-1 flex flex-wrap items-center gap-1.5">
                {member.you && <Badge variant="outline">You</Badge>}
                <Badge variant={outside ? 'warning' : 'secondary'}>{member.access}</Badge>
              </span>
            </span>
          </div>
        )}
      </DrawerHeader>
      <DrawerBody>
        {member && (
          <div className="flex flex-col gap-6">
            <DrawerList
              mobileStack
              items={[
                { label: 'Address', content: <IdentityRow inline address={member.address} /> },
                { label: 'Role', content: member.role },
                { label: 'Signs', content: member.safes.length ? `${member.safes.length} Safes` : 'Not a signer' },
              ]}
            />
            <DrawerSection
              collapsible
              defaultOpen={false}
              title={`Waiting on ${member.you ? 'you' : member.name}`}
              rightNode={String(member.waiting.length)}
            >
              <TxList txs={member.waiting} empty="Nothing waiting." onOpenTx={onOpenTx} />
            </DrawerSection>
            <DrawerSection
              collapsible
              defaultOpen={false}
              title="Signed, still pending"
              rightNode={String(member.signed.length)}
            >
              <TxList txs={member.signed} empty="No pending signatures." onOpenTx={onOpenTx} />
            </DrawerSection>
            <DrawerSection collapsible defaultOpen={false} title="Safes" rightNode={String(member.safes.length)}>
              {member.safes.length ? (
                <div className="flex flex-col">
                  {member.safes.map((account) => (
                    <LinkRow
                      key={account.id}
                      title={account.name}
                      detail={`${account.network} · ${account.threshold} of ${account.owners.length} · ${shortAddress(account.iconAddress)}`}
                      onClick={() => onOpenSafe(account)}
                    />
                  ))}
                </div>
              ) : (
                <p className="px-2 text-sm text-muted-foreground">Doesn’t sign any Safe.</p>
              )}
            </DrawerSection>
          </div>
        )}
      </DrawerBody>
      <div className="shrink-0 border-t border-border bg-background">
        <DrawerFooter safeArea>
          {member && (
            <div className="flex flex-col gap-2 pt-4">
              {!member.you && member.waiting.length > 0 && (outside ? canInvite(persona) : true) && (
                <Button className="w-full" onClick={() => (outside ? onInvite(member) : onRemind(member))}>
                  {outside ? <UserPlus /> : <Bell />}
                  {outside ? `Invite ${member.name}` : `Remind ${member.name}`}
                </Button>
              )}
              {member.waiting.length > 0 && (
                <Button className="w-full" variant="ghost" onClick={() => onShowInQueue(member.id)}>
                  <Filter /> Show what’s waiting in the queue
                </Button>
              )}
            </div>
          )}
        </DrawerFooter>
      </div>
    </Drawer>
  )
}
