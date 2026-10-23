import { Button } from '@safe-global/views/components/ui/button'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import { getSignerName } from '../../services/model'
import { getAttestation, getPolicies, getRegistry } from '../../services/registry'
import { getRequirementGaps } from '../../services/requirements'
import { SafeTitle } from '../QueueTable/QueueSection'
import type { Account, Persona, Proposal } from '../../types'
import { PolicyIcons, RequirementsBadge } from './RegistryBadges'

// Fleet admin: the registry. Every Safe, what it's for, who owns it, and whether its record is complete.
export function SafeListTable({
  accounts,
  scope,
  items,
  persona,
  label,
  onOpen,
  onShow,
}: {
  accounts: Account[]
  // Every Safe in the workspace, for the checks that compare Safes.
  scope: Account[]
  items: Proposal[]
  persona: Persona
  label: string
  onOpen: (account: Account) => void
  onShow: (id: string) => void
}) {
  return (
    <Card radius="xl" size="none">
      <CardContent>
        <Table aria-label={label} variant="panel" className="[&_td]:px-4 [&_th]:px-4">
          <TableHeader>
            <TableRow>
              <TableHead>Safe</TableHead>
              <TableHead>Point of contact</TableHead>
              <TableHead>Threshold</TableHead>
              <TableHead>Attested</TableHead>
              <TableHead>Policies</TableHead>
              <TableHead>Requirements</TableHead>
              <TableHead>Pending</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => {
              const { contact } = getRegistry(account)
              const txs = items.filter((tx) => tx.account === account.id)
              const attested = account.owners.filter((signer) => getAttestation(account, signer) === 'attested')
              return (
                <TableRow key={account.id} className="cursor-pointer" onClick={() => onOpen(account)}>
                  <TableCell>
                    <SafeTitle account={account} persona={persona} size={24} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {contact ? getSignerName(contact) : <span className="text-warning-strong">Not assigned</span>}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {account.threshold} of {account.owners.length}
                  </TableCell>
                  <TableCell
                    className={`text-sm tabular-nums ${attested.length < account.owners.length ? 'text-warning-strong' : ''}`}
                  >
                    {attested.length} of {account.owners.length}
                  </TableCell>
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <PolicyIcons policies={getPolicies(account)} />
                  </TableCell>
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <RequirementsBadge issues={getRequirementGaps(account, scope)} />
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{txs.length || '—'}</TableCell>
                  <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                    <Button size="sm" variant="ghost" disabled={!txs.length} onClick={() => onShow(account.id)}>
                      Show
                    </Button>
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
