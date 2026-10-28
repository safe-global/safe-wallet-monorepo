import { Plus } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
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
import { getSignerIdentity, getSignerName, shortAddress } from '../../services/model'
import { getAttestation, getPolicies, getRegistry, getSafeGroup, getWallet } from '../../services/registry'
import { describeDrift, getDrift, getRequirementChecks } from '../../services/requirements'
import type { Account, Proposal } from '../../types'
import { IdentityRow } from '../ReviewDrawer/steps/IdentityRow'
import { chainLogoUrl } from '../shared'
import { LinkRow, TxList } from './DrawerRows'
import { AttestationBadge, PolicyList, RequirementsBadge, RequirementChecklist } from './RegistryBadges'

// Fleet admin: the registry record for one Safe, with what the team should keep current.
export function SafeDrawer({
  account,
  scope,
  items,
  onClose,
  onOpenSafe,
  onOpenMember,
  onOpenTx,
  onShowInQueue,
  onAddPolicy,
}: {
  account: Account | null
  // Every Safe in the workspace, to compare networks.
  scope: Account[]
  items: Proposal[]
  onClose: () => void
  onOpenSafe: (account: Account) => void
  onOpenMember: (id: string) => void
  onOpenTx: (tx: Proposal) => void
  onShowInQueue: (account: Account) => void
  onAddPolicy: (account: Account) => void
}) {
  const registry = account && getRegistry(account)
  const checks = account ? getRequirementChecks(account, scope) : []
  const issues = checks.filter((check) => !check.pass)
  const attested = account ? account.owners.filter((signer) => getAttestation(account, signer) === 'attested') : []
  const siblings = account
    ? scope.filter((other) => other.id !== account.id && getSafeGroup(other) === getSafeGroup(account))
    : []
  const drift = account ? getDrift(account, scope) : []
  const pending = account ? items.filter((tx) => tx.account === account.id) : []
  return (
    <Drawer resizable mobileFullScreen open={!!account} onClose={onClose} ariaLabel="Safe details">
      <DrawerHeader>
        {account && registry && (
          <div className="flex min-w-0 flex-1 items-center gap-3 pr-18">
            <span className="flex shrink-0">
              <Identicon address={account.iconAddress} size={40} />
            </span>
            <span className="min-w-0">
              <DrawerTitle size="lg">{account.name}</DrawerTitle>
              <span className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
                  <img src={chainLogoUrl(account.chainId)} alt="" className="size-3.5 rounded-full" />
                  {account.network}
                </Badge>
                <RequirementsBadge issues={issues} />
              </span>
            </span>
          </div>
        )}
      </DrawerHeader>
      <DrawerBody>
        {account && registry && (
          <div className="flex flex-col gap-6">
            <DrawerList
              mobileStack
              items={[
                {
                  label: 'Purpose',
                  content: registry.purpose ?? <span className="text-warning-strong">Not recorded</span>,
                },
                {
                  label: 'Point of contact',
                  content: registry.contact ? (
                    <button type="button" className="hover:underline" onClick={() => onOpenMember(registry.contact!)}>
                      {getSignerName(registry.contact)}
                    </button>
                  ) : (
                    <span className="text-warning-strong">Not assigned</span>
                  ),
                },
                { label: 'Threshold', content: `${account.threshold} of ${account.owners.length} signers` },
                {
                  label: 'Address',
                  content: <IdentityRow inline address={account.iconAddress} chainId={account.chainId} />,
                },
              ]}
            />
            <DrawerSection
              key={`requirements-${account.id}`}
              collapsible
              defaultOpen={issues.length > 0}
              title="Requirements"
              rightNode={`${checks.length - issues.length} of ${checks.length} met`}
            >
              <RequirementChecklist checks={checks} />
            </DrawerSection>
            <DrawerSection collapsible title="Policies" rightNode={String(getPolicies(account).length)}>
              <PolicyList policies={getPolicies(account)} />
            </DrawerSection>
            <DrawerSection
              collapsible
              title="Signers"
              rightNode={`${attested.length} of ${account.owners.length} attested`}
            >
              <ul className="flex flex-col">
                {account.owners.map((signer) => (
                  <li key={signer}>
                    <button
                      type="button"
                      onClick={() => onOpenMember(signer)}
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Identicon address={getSignerIdentity(signer).address} size={24} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{getSignerName(signer)}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {getWallet(signer)} · {shortAddress(getSignerIdentity(signer).address)}
                        </span>
                      </span>
                      <AttestationBadge status={getAttestation(account, signer)} />
                    </button>
                  </li>
                ))}
              </ul>
            </DrawerSection>
            {siblings.length > 0 && (
              <DrawerSection collapsible title="Other networks" rightNode={String(siblings.length)}>
                <div className="flex flex-col">
                  {siblings.map((other) => (
                    <LinkRow
                      key={other.id}
                      title={other.network}
                      detail={
                        drift.includes(other) ? `Differs: ${describeDrift(account, other)}` : 'Same configuration'
                      }
                      onClick={() => onOpenSafe(other)}
                    />
                  ))}
                </div>
              </DrawerSection>
            )}
            <DrawerSection collapsible defaultOpen={false} title="Pending" rightNode={String(pending.length)}>
              <TxList txs={pending} empty="Nothing pending." onOpenTx={onOpenTx} />
            </DrawerSection>
          </div>
        )}
      </DrawerBody>
      <div className="shrink-0 border-t border-border bg-background">
        <DrawerFooter safeArea>
          {account && (
            <div className="flex flex-col gap-2 pt-4">
              {pending.length > 0 && (
                <Button className="w-full" onClick={() => onShowInQueue(account)}>
                  View transactions
                </Button>
              )}
              <Button className="w-full" variant="outline" onClick={() => onAddPolicy(account)}>
                <Plus /> Add policy
              </Button>
            </div>
          )}
        </DrawerFooter>
      </div>
    </Drawer>
  )
}
