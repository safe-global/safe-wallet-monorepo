import { Bell, UserPlus } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import Identicon from '@/components/common/Identicon'
import { getSignerIdentity, getSignerName, knownAccounts } from '../../services/model'
import { canInvite, isYou } from '../../services/personas'
import type { SignerLoad } from '../../services/fleet'
import type { Persona } from '../../types'

export const waitedFor = (since: number | undefined, now = Date.now()) => {
  if (since === undefined) return '—'
  const hours = Math.floor((now - since) / 3_600_000)
  return hours < 24 ? `${Math.max(hours, 1)}h` : `${Math.floor(hours / 24)}d`
}

// Fleet admin: the queue turned around. Who the fleet is waiting on, across every Safe.
export function SignerLoadTable({
  load,
  persona,
  onShow,
  onOpen,
  onRemind,
  onInvite,
}: {
  load: SignerLoad[]
  persona: Persona
  onShow: (id: string) => void
  // Row click: the member drawer.
  onOpen: (id: string) => void
  onRemind: (load: SignerLoad) => void
  onInvite: (load: SignerLoad) => void
}) {
  return (
    <Card radius="xl" size="none">
      <CardContent>
        <Table aria-label="Pending signatures by signer" variant="panel" className="[&_td]:px-4 [&_th]:px-4">
          <TableHeader>
            <TableRow>
              <TableHead>Signer</TableHead>
              <TableHead>Waiting on them</TableHead>
              <TableHead>Safes</TableHead>
              <TableHead>Oldest</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {load.map((signer) => {
              const names = signer.safes.map((id) => knownAccounts.find((account) => account.id === id)?.name ?? id)
              const you = isYou(signer.id, persona)
              return (
                <TableRow key={signer.id} className="cursor-pointer" onClick={() => onOpen(signer.id)}>
                  <TableCell>
                    <span className="flex items-center gap-3">
                      <Identicon address={getSignerIdentity(signer.id).address} size={24} />
                      <span className="text-sm">{getSignerName(signer.id)}</span>
                      {you && <Badge variant="outline">You</Badge>}
                      {!signer.member && <Badge variant="warning">Not in workspace</Badge>}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {signer.txs.length
                      ? `${signer.txs.length} ${signer.txs.length === 1 ? 'transaction' : 'transactions'}`
                      : 'Nothing waiting'}
                  </TableCell>
                  <TableCell className="max-w-64 text-xs text-muted-foreground">
                    <span className="block truncate" title={names.join(', ')}>
                      {signer.safes.length ? `${signer.safes.length} · ${names.slice(0, 2).join(', ')}` : '—'}
                      {names.length > 2 ? ` +${names.length - 2}` : ''}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{waitedFor(signer.oldest)}</TableCell>
                  <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                    <span className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => onShow(signer.id)}>
                        Show
                      </Button>
                      {you || !signer.txs.length ? null : signer.member ? (
                        <Button size="sm" variant="outline" onClick={() => onRemind(signer)}>
                          <Bell /> Remind
                        </Button>
                      ) : (
                        canInvite(persona) && (
                          <Button size="sm" variant="outline" onClick={() => onInvite(signer)}>
                            <UserPlus /> Invite
                          </Button>
                        )
                      )}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
