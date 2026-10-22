import type { Persona, Proposal } from '../types'
import type { PreviewAction } from './queue'
import {
  getAccount,
  getConflicts,
  getCreator,
  getOutstandingSigners,
  getSignerName,
  getState,
  isWorkspaceMember,
} from './model'
import { canInvite, getYou, isSignerOf, isYou } from './personas'

// Shared rules for the queue row and the drawer. The drawer confirm step replaces ConfirmTxFlow.

export type PrimaryAction =
  | { kind: 'flow'; label: string; flow: PreviewAction; hint?: string }
  | { kind: 'goTo'; label: string; target: Proposal; hint: string }
  | { kind: 'remind'; label: string; target: Proposal; hint?: string }
  | { kind: 'review'; label: string; hint?: string }

export type MenuAction = 'remind' | 'invite' | 'replace' | 'reject' | 'delete' | 'copyLink'
export const MENU_LABELS: Record<MenuAction, string> = {
  remind: 'Remind signers',
  invite: 'Invite signers to workspace',
  replace: 'Replace with a transfer',
  reject: 'Reject',
  delete: 'Delete from queue',
  copyLink: 'Copy link',
}

const othersOutstanding = (tx: Proposal, persona: Persona) =>
  getOutstandingSigners(tx).filter((id) => !isYou(id, persona))

export const othersMissing = (tx: Proposal, persona: Persona) => othersOutstanding(tx, persona).map(getSignerName)
// Any workspace member can remind. Only signers in the workspace get the reminder.
export const getRemindable = (tx: Proposal, persona: Persona) =>
  othersOutstanding(tx, persona).filter(isWorkspaceMember).map(getSignerName)
export const getOutsiders = (tx: Proposal, persona: Persona) =>
  othersOutstanding(tx, persona)
    .filter((id) => !isWorkspaceMember(id))
    .map(getSignerName)
const canRemind = (tx: Proposal, persona: Persona) =>
  getState(tx, persona).missing > 0 && getRemindable(tx, persona).length > 0

export const people = (names: string[]) => (names.length > 2 ? `${names.length} signers` : names.join(' and '))

export const getBlocker = (tx: Proposal, items: Proposal[], persona: Persona) => {
  const state = getState(tx, persona)
  if (!state.waiting || state.canSign) return {}
  const { nextNonce } = getAccount(tx)
  const blockers = items.filter((other) => other.account === tx.account && other.nonce === nextNonce)
  const actionable = blockers.find((other) => {
    const blockerState = getState(other, persona)
    return blockerState.canSign || blockerState.ready
  })
  const waiting = actionable ? undefined : blockers.find((other) => canRemind(other, persona))
  return { nonce: nextNonce, actionable, waiting }
}

export const getPrimaryAction = (
  tx: Proposal,
  items: Proposal[],
  persona: Persona,
  remindedIds: string[] = [],
  surface: 'row' | 'drawer' = 'drawer',
): PrimaryAction => {
  const state = getState(tx, persona)
  if (state.ready) return { kind: 'flow', label: 'Execute', flow: 'execute' }
  // Only one conflicting option can execute. The row asks you to review before you sign a second one.
  const you = getYou(persona)
  const signedOther = !!you && getConflicts(tx, items).some((other) => other.signers.includes(you))
  if (state.canSign && signedOther) {
    const hint = `You signed another option at #${tx.nonce}. Only one can execute.`
    return surface === 'row'
      ? { kind: 'review', label: 'Review', hint }
      : { kind: 'flow', label: 'Sign this option too', flow: 'sign', hint }
  }
  if (state.canSign)
    return {
      kind: 'flow',
      label: 'Sign',
      flow: state.finalSignature ? 'signAndExecute' : 'sign',
      hint: state.finalSignature ? 'Yours is the last signature. You can execute right after.' : undefined,
    }
  const blocker = getBlocker(tx, items, persona)
  if (blocker.actionable)
    return {
      kind: 'goTo',
      label: `Go to #${blocker.nonce}`,
      target: blocker.actionable,
      hint: getState(blocker.actionable, persona).canSign
        ? `#${blocker.nonce} needs your signature first.`
        : `#${blocker.nonce} is fully signed. Execute it first.`,
    }
  if (blocker.waiting)
    return {
      kind: 'remind',
      label: remindedIds.includes(blocker.waiting.id) ? 'Reminded' : 'Remind',
      target: blocker.waiting,
      hint: `#${blocker.nonce} is waiting on ${people(othersMissing(blocker.waiting, persona))}.`,
    }
  if (!state.waiting && canRemind(tx, persona))
    return { kind: 'remind', label: remindedIds.includes(tx.id) ? 'Reminded' : 'Remind', target: tx }
  return { kind: 'review', label: 'Review' }
}

export type MenuItem = { action: MenuAction; reason?: string }
// Actions most people can take come first. Invite (admins) and Delete (the proposer) are rarer, so they go last.
const MENU_ORDER: MenuAction[] = ['remind', 'replace', 'reject', 'copyLink', 'invite', 'delete']
export const RARE_MENU_ACTIONS: MenuAction[] = ['invite', 'delete']

// Every row has the same menu in the same order. An action you can't take is disabled, with the reason.
export const getMenuItems = (tx: Proposal, items: Proposal[], persona: Persona): MenuItem[] => {
  const owner = isSignerOf(getAccount(tx), persona)
  const missing = getState(tx, persona).missing
  const outsiders = missing > 0 ? getOutsiders(tx, persona) : []
  const rejectionExists = [tx, ...getConflicts(tx, items)].some((other) => other.kind.type === 'rejection')
  const reasons: Record<MenuAction, string | undefined> = {
    remind:
      missing === 0
        ? 'All signatures are in.'
        : getRemindable(tx, persona).length > 0
          ? undefined
          : outsiders.length > 0
            ? "The missing signers aren't in the workspace yet. Invite them first."
            : 'Only your signature is missing.',
    invite: !canInvite(persona)
      ? 'Only workspace admins can invite signers.'
      : missing === 0
        ? 'All signatures are in.'
        : outsiders.length === 0
          ? 'Every missing signer is already in the workspace.'
          : undefined,
    replace: owner ? undefined : 'Only signers of this Safe can replace it.',
    reject: !owner
      ? 'Only signers of this Safe can reject it.'
      : rejectionExists
        ? 'A rejection at this nonce already exists.'
        : undefined,
    delete: getDeleteBlock(tx, items, persona),
    copyLink: undefined,
  }
  return MENU_ORDER.map((action) => ({ action, reason: reasons[action] }))
}

// The actions you can take, for the drawer footer.
export const getMenuActions = (tx: Proposal, items: Proposal[], persona: Persona) =>
  getMenuItems(tx, items, persona)
    .filter((item) => !item.reason)
    .map((item) => item.action)

// Production: only the proposer can delete, and only the last nonce or a duplicate. Undefined when allowed.
export const getDeleteBlock = (tx: Proposal, items: Proposal[], persona: Persona) => {
  if (getCreator(tx) !== getYou(persona)) return 'Only the person who proposed it can delete it.'
  const lastInSafe = !items.some((other) => other.account === tx.account && other.nonce > tx.nonce)
  if (!lastInSafe && getConflicts(tx, items).length === 0)
    return 'Delete the later transactions first, or replace this one.'
  return undefined
}

// Status hint: the current state, then the next step.
export const getStatusHint = (tx: Proposal, items: Proposal[], persona: Persona) => {
  const state = getState(tx, persona)
  if (state.ready) return 'Fully signed and next in line. Execute it.'
  if (state.waiting) {
    const blocker = getBlocker(tx, items, persona)
    const next = state.canSign
      ? 'You can sign this now.'
      : blocker.actionable
        ? getState(blocker.actionable, persona).canSign
          ? `Sign #${blocker.nonce} first.`
          : `Execute #${blocker.nonce} first.`
        : blocker.waiting
          ? `#${blocker.nonce} is waiting on ${people(othersMissing(blocker.waiting, persona))}.`
          : 'Nothing to do yet.'
    return `Executes after #${getAccount(tx).nextNonce}. ${next}`
  }
  if (state.canSign)
    return state.finalSignature ? 'Yours is the last signature needed.' : 'Needs your signature. Sign it.'
  const names = othersMissing(tx, persona)
  const who = state.missing < names.length ? `${state.missing} more from ${people(names)}` : people(names)
  return `Waiting on ${who}.${canRemind(tx, persona) ? ' Remind them.' : ''}`
}
