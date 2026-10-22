import type { Account } from '../types'
import { getSignerName } from './model'
import { getAttestation, getRegistry, getSafeGroup } from './registry'

export type RequirementCheck = { id: string; label: string; pass: boolean; detail?: string }

const ownersKey = (account: Account) => [...account.owners].sort().join(',')
const names = (ids: string[]) => ids.map(getSignerName).join(', ')

// Other deployments of the same Safe whose signers or threshold differ.
export const getDrift = (account: Account, scope: Account[]) =>
  scope.filter(
    (other) =>
      other.id !== account.id &&
      getSafeGroup(other) === getSafeGroup(account) &&
      (other.threshold !== account.threshold || ownersKey(other) !== ownersKey(account)),
  )

// How another deployment differs, e.g. "adds Nadia, no Sam".
export const describeDrift = (account: Account, other: Account) => {
  const added = other.owners.filter((signer) => !account.owners.includes(signer))
  const removed = account.owners.filter((signer) => !other.owners.includes(signer))
  return [
    ...(other.threshold !== account.threshold ? [`threshold ${other.threshold} of ${other.owners.length}`] : []),
    ...(added.length ? [`adds ${names(added)}`] : []),
    ...(removed.length ? [`no ${names(removed)}`] : []),
  ].join(', ')
}

// What a team should keep current for every Safe, one check per item.
export const getRequirementChecks = (account: Account, scope: Account[]): RequirementCheck[] => {
  const { contact, purpose } = getRegistry(account)
  const unattested = account.owners.filter((signer) => getAttestation(account, signer) !== 'attested')
  const drift = getDrift(account, scope)
  const siblings = scope.some((other) => other.id !== account.id && getSafeGroup(other) === getSafeGroup(account))
  return [
    {
      id: 'registry',
      label: 'Purpose and point of contact recorded',
      pass: !!contact && !!purpose,
      detail: contact && purpose ? undefined : 'Missing from the registry.',
    },
    {
      id: 'attested',
      label: 'Every signer attested',
      pass: !unattested.length,
      detail: unattested.length ? `Waiting on ${names(unattested)}` : undefined,
    },
    ...(siblings
      ? [
          {
            id: 'drift',
            label: 'Matches its other networks',
            pass: !drift.length,
            detail: drift.length ? `Differs from ${drift.map((other) => other.network).join(', ')}` : undefined,
          },
        ]
      : []),
  ]
}

export const getRequirementGaps = (account: Account, scope: Account[]) =>
  getRequirementChecks(account, scope).filter((check) => !check.pass)
export const missesRequirements = (account: Account, scope: Account[]) => getRequirementGaps(account, scope).length > 0
