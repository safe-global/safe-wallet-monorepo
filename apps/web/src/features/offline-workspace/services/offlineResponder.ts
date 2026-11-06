import type { BaseQueryApi, FetchArgs } from '@reduxjs/toolkit/query'
import type { LocalResponse } from '@safe-global/store/gateway/cgwClient'
import type {
  AddressBookItem,
  CreateSpaceDto,
  CreateSpaceSafesDto,
  DeleteSpaceSafesDto,
  GetSpaceResponse,
  InviteUsersDto,
  Invitation,
  MemberDto,
  SpaceAddressBookDto,
  UpdateMemberAliasDto,
  UpdateRoleDto,
  UpdateSpaceDto,
  UpsertAddressBookItemsDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { UserWithWallets } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import type { UserSession } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import type { EntitlementsResponse } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { RootState } from '@/store'
import {
  removeOfflineWorkspace,
  selectIsOfflineWorkspace,
  selectOfflineWorkspaces,
  upsertOfflineWorkspace,
} from '../store/offlineWorkspaceSlice'
import type { OfflineContact, OfflineMember, OfflineSafe, OfflineWorkspace } from '../types'
import { OFFLINE_USER_ID, createOfflineWorkspace, getNextMemberId } from './workspaceFile'

type OfflineRequest = {
  params: string[]
  body: unknown
  workspaces: OfflineWorkspace[]
  save: (workspace: OfflineWorkspace) => void
  remove: (uuid: string) => void
}

type Handler = (request: OfflineRequest) => LocalResponse
type WorkspaceHandler = (workspace: OfflineWorkspace, request: OfflineRequest) => LocalResponse

const WORKSPACE_ROUTE = /^\/v1\/(spaces|users|auth|billing)(\/|$)/

const NOT_FOUND: LocalResponse = { error: { status: 404, data: { message: 'Not found' } } }
const NOT_AVAILABLE: LocalResponse = { error: { status: 404, data: { message: 'Not available in offline mode' } } }
const SAFENET_OFF: LocalResponse = { error: { status: 501, data: { message: 'Not available in offline mode' } } }

const OFFLINE_USER: UserWithWallets = { id: OFFLINE_USER_ID, status: 1, wallets: [] }
const OFFLINE_SESSION: UserSession = { id: String(OFFLINE_USER_ID), authMethod: 'siwe' }

const ok = (data: unknown = null): LocalResponse => ({ data })
const now = () => new Date().toISOString()

const touch = (workspace: OfflineWorkspace, changes: Partial<OfflineWorkspace>): OfflineWorkspace => ({
  ...workspace,
  ...changes,
  updatedAt: now(),
})

const isSameSafe = (a: OfflineSafe, b: OfflineSafe) => a.chainId === b.chainId && sameAddress(a.address, b.address)

const groupSafesByChain = (safes: OfflineSafe[]): Record<string, string[]> =>
  safes.reduce<Record<string, string[]>>((byChain, { chainId, address }) => {
    byChain[chainId] = [...(byChain[chainId] ?? []), address]
    return byChain
  }, {})

const getSelf = (workspace: OfflineWorkspace) => workspace.members.find((member) => member.id === OFFLINE_USER_ID)

const toSpaceResponse = (workspace: OfflineWorkspace): GetSpaceResponse => ({
  uuid: workspace.uuid,
  name: workspace.name,
  members: workspace.members.map((member) => ({
    role: member.role,
    name: member.name,
    invitedBy: null,
    inviteExpiresAt: null,
    status: 'ACTIVE',
    user: { id: member.id },
  })),
  memberCount: workspace.members.length,
  safeCount: workspace.safes.length,
  experimentalFeatures: [],
})

const toMemberDto = (member: OfflineMember): MemberDto => ({
  id: member.id,
  role: member.role,
  status: 'ACTIVE',
  name: member.name,
  alias: member.alias,
  invitedBy: null,
  inviteExpiresAt: null,
  createdAt: member.createdAt,
  updatedAt: member.updatedAt,
  user: { id: member.id, status: 'ACTIVE', email: member.email, address: member.address },
})

const toAddressBookDto = (workspace: OfflineWorkspace): SpaceAddressBookDto => {
  const self = getSelf(workspace)
  const author = self?.address ?? self?.name ?? ''
  return {
    spaceUuid: workspace.uuid,
    data: workspace.addressBook.map((contact) => ({
      ...contact,
      createdBy: author,
      createdByUserId: OFFLINE_USER_ID,
      lastUpdatedBy: author,
      lastUpdatedByUserId: OFFLINE_USER_ID,
    })),
  }
}

const toEntitlements = (workspace: OfflineWorkspace): EntitlementsResponse => ({
  plan: null,
  // Seats are local, so they are unlimited; every paid feature stays off
  entitlements: [
    {
      feature: 'safe_seats',
      enabled: true,
      type: 'metered',
      quota: null,
      used: new Set(workspace.safes.map((safe) => safe.address.toLowerCase())).size,
      resetsAt: null,
    },
  ],
})

const upsertContacts = (contacts: OfflineContact[], items: AddressBookItem[]): OfflineContact[] =>
  items.reduce((result, { name, address, chainIds }) => {
    const existing = result.find((contact) => sameAddress(contact.address, address))
    if (!existing) return [...result, { name, address, chainIds, createdAt: now(), updatedAt: now() }]
    return result.map((contact) => (contact === existing ? { ...contact, name, chainIds, updatedAt: now() } : contact))
  }, contacts)

const updateMember = (
  workspace: OfflineWorkspace,
  request: OfflineRequest,
  userId: number,
  changes: Partial<OfflineMember>,
): LocalResponse => {
  if (!workspace.members.some((member) => member.id === userId)) return NOT_FOUND
  const members = workspace.members.map((member) =>
    member.id === userId ? { ...member, ...changes, updatedAt: now() } : member,
  )
  request.save(touch(workspace, { members }))
  return ok()
}

const inWorkspace =
  (handler: WorkspaceHandler): Handler =>
  (request) => {
    const workspace = request.workspaces.find(({ uuid }) => uuid === request.params[0])
    return workspace ? handler(workspace, request) : NOT_FOUND
  }

const createWorkspace: Handler = ({ body, save }) => {
  const workspace = createOfflineWorkspace((body as CreateSpaceDto).name, now())
  save(workspace)
  return ok({ name: workspace.name, uuid: workspace.uuid })
}

const addSafes: WorkspaceHandler = (workspace, { body, save }) => {
  const { safes, addressBookItems = [] } = body as CreateSpaceSafesDto
  const added = safes.filter(
    (safe, index) =>
      !workspace.safes.some((existing) => isSameSafe(existing, safe)) &&
      safes.findIndex((other) => isSameSafe(other, safe)) === index,
  )
  save(
    touch(workspace, {
      safes: [...workspace.safes, ...added],
      addressBook: upsertContacts(workspace.addressBook, addressBookItems),
    }),
  )
  return ok()
}

const inviteMembers: WorkspaceHandler = (workspace, { body, save }) => {
  let nextId = getNextMemberId(workspace.members)
  const invited = (body as InviteUsersDto).users.map((user) => ({
    id: nextId++,
    name: user.name,
    alias: null,
    role: user.role,
    address: user.type === 'wallet' ? user.address : null,
    email: user.type === 'email' ? user.email : null,
    createdAt: now(),
    updatedAt: now(),
  }))
  save(touch(workspace, { members: [...workspace.members, ...invited] }))
  return ok(
    invited.map<Invitation>((member) => ({
      userId: member.id,
      name: member.name,
      spaceUuid: workspace.uuid,
      role: member.role,
      status: 'ACTIVE',
      invitedBy: OFFLINE_USER_ID,
    })),
  )
}

const SPACE = '/v1/spaces/([^/]+)'

const ROUTES: [method: string, path: RegExp, handler: Handler][] = [
  ['GET', /^\/v1\/auth\/me$/, () => ok(OFFLINE_SESSION)],
  ['GET', /^\/v1\/users$/, () => ok(OFFLINE_USER)],
  ['GET', /^\/v1\/users\/counterfactual-safes$/, () => ok({ safes: {} })],
  ['POST', /^\/v1\/users\/counterfactual-safes$/, () => ok()],
  ['DELETE', /^\/v1\/users\/counterfactual-safes$/, () => ok()],
  ['GET', /^\/v1\/billing\/spaces\/[^/]+\/(subscriptions|payment-links)$/, () => ok([])],

  ['GET', /^\/v1\/spaces$/, ({ workspaces }) => ok(workspaces.map(toSpaceResponse))],
  ['POST', /^\/v1\/spaces$/, createWorkspace],
  [
    'GET',
    /^\/v1\/spaces\/safes$/,
    ({ workspaces }) =>
      ok(workspaces.map((workspace) => ({ spaceUuid: workspace.uuid, safes: groupSafesByChain(workspace.safes) }))),
  ],
  [
    'GET',
    /^\/v1\/spaces\/entitlements$/,
    ({ workspaces }) =>
      ok(Object.fromEntries(workspaces.map((workspace) => [workspace.uuid, toEntitlements(workspace)]))),
  ],
  ['GET', new RegExp(`^${SPACE}$`), inWorkspace((workspace) => ok(toSpaceResponse(workspace)))],
  [
    'PATCH',
    new RegExp(`^${SPACE}$`),
    inWorkspace((workspace, { body, save }) => {
      const { name } = body as UpdateSpaceDto
      save(touch(workspace, name ? { name } : {}))
      return ok({ uuid: workspace.uuid })
    }),
  ],
  [
    'DELETE',
    new RegExp(`^${SPACE}$`),
    inWorkspace((workspace, { remove }) => {
      remove(workspace.uuid)
      return ok()
    }),
  ],

  [
    'GET',
    new RegExp(`^${SPACE}/safes$`),
    inWorkspace((workspace) => ok({ safes: groupSafesByChain(workspace.safes) })),
  ],
  ['POST', new RegExp(`^${SPACE}/safes$`), inWorkspace(addSafes)],
  [
    'DELETE',
    new RegExp(`^${SPACE}/safes$`),
    inWorkspace((workspace, { body, save }) => {
      const { safes } = body as DeleteSpaceSafesDto
      save(
        touch(workspace, { safes: workspace.safes.filter((safe) => !safes.some((other) => isSameSafe(safe, other))) }),
      )
      return ok()
    }),
  ],

  ['GET', new RegExp(`^${SPACE}/address-book$`), inWorkspace((workspace) => ok(toAddressBookDto(workspace)))],
  [
    'PUT',
    new RegExp(`^${SPACE}/address-book$`),
    inWorkspace((workspace, { body, save }) => {
      const updated = touch(workspace, {
        addressBook: upsertContacts(workspace.addressBook, (body as UpsertAddressBookItemsDto).items),
      })
      save(updated)
      return ok(toAddressBookDto(updated))
    }),
  ],
  [
    'DELETE',
    new RegExp(`^${SPACE}/address-book/([^/]+)$`),
    inWorkspace((workspace, { params, save }) => {
      const addressBook = workspace.addressBook.filter((contact) => !sameAddress(contact.address, params[1]))
      save(touch(workspace, { addressBook }))
      return ok()
    }),
  ],
  [
    'GET',
    new RegExp(`^${SPACE}/address-book/requests$`),
    inWorkspace((workspace) => ok({ spaceUuid: workspace.uuid, data: [] })),
  ],

  [
    'GET',
    new RegExp(`^${SPACE}/members$`),
    inWorkspace((workspace) => ok({ members: workspace.members.map(toMemberDto) })),
  ],
  [
    'GET',
    new RegExp(`^${SPACE}/membership$`),
    inWorkspace((workspace) => {
      const self = getSelf(workspace)
      return self ? ok(toMemberDto(self)) : NOT_FOUND
    }),
  ],
  ['POST', new RegExp(`^${SPACE}/members/invite$`), inWorkspace(inviteMembers)],
  [
    'PATCH',
    new RegExp(`^${SPACE}/members/alias$`),
    inWorkspace((workspace, request) =>
      updateMember(workspace, request, OFFLINE_USER_ID, { alias: (request.body as UpdateMemberAliasDto).alias }),
    ),
  ],
  [
    'PATCH',
    new RegExp(`^${SPACE}/members/(\\d+)/role$`),
    inWorkspace((workspace, request) =>
      updateMember(workspace, request, Number(request.params[1]), { role: (request.body as UpdateRoleDto).role }),
    ),
  ],
  [
    'DELETE',
    new RegExp(`^${SPACE}/members/(\\d+)$`),
    inWorkspace((workspace, { params, save }) => {
      const userId = Number(params[1])
      if (userId === OFFLINE_USER_ID) return NOT_AVAILABLE
      save(touch(workspace, { members: workspace.members.filter((member) => member.id !== userId) }))
      return ok()
    }),
  ],

  ['GET', new RegExp(`^${SPACE}/entitlements$`), inWorkspace((workspace) => ok(toEntitlements(workspace)))],
  ['GET', new RegExp(`^${SPACE}/counterfactual-safes$`), inWorkspace(() => ok({ safes: {} }))],
  [
    'GET',
    new RegExp(`^${SPACE}/audit-log$`),
    inWorkspace(() => ok({ count: 0, next: null, previous: null, results: [] })),
  ],
  ['GET', new RegExp(`^${SPACE}/audit-log/actors$`), inWorkspace(() => ok([]))],
  ['GET', new RegExp(`^${SPACE}/policies/(active|pending)$`), inWorkspace(() => ok([]))],
  // A refusal the Safenet check expects, so it is not logged as a fault
  ['POST', new RegExp(`^${SPACE}/chains/[^/]+/safes/[^/]+/safenet/checks$`), () => SAFENET_OFF],
]

/** In offline mode, answers every Workspace request from the local store; anything else goes to CGW. */
export const offlineResponder = (args: FetchArgs, api: BaseQueryApi): LocalResponse | undefined => {
  const state = api.getState() as RootState
  const path = args.url.split('?')[0]
  if (!selectIsOfflineWorkspace(state) || !WORKSPACE_ROUTE.test(path)) return undefined

  const method = (args.method ?? 'GET').toUpperCase()
  for (const [routeMethod, pattern, handler] of ROUTES) {
    const match = routeMethod === method ? pattern.exec(path) : null
    if (match) {
      return handler({
        params: match.slice(1).map(decodeURIComponent),
        body: args.body,
        workspaces: selectOfflineWorkspaces(state),
        save: (workspace) => api.dispatch(upsertOfflineWorkspace(workspace)),
        remove: (uuid) => api.dispatch(removeOfflineWorkspace(uuid)),
      })
    }
  }

  return NOT_AVAILABLE
}
