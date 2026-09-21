import {
  buildCommittedLog,
  buildDisputeResolvedLog,
  buildNewRequestLog,
  buildOracleAttestedLog,
  buildOracleProposedLog,
  buildOracleResultLog,
  buildPlainAttestedLog,
  buildPlainProposedLog,
  buildRevealedLog,
} from './rawLogs'
import { decodeLogs, type RawLog } from '../utils/decodeLogs'
import type {
  DisputeResolvedEvent,
  NormalizedCheckEvent,
  OracleAttestedEvent,
  OracleProposedEvent,
  OracleResultEvent,
  PlainAttestedEvent,
  PlainProposedEvent,
  RequestCreatedEvent,
  SentinelCommittedEvent,
  SentinelRevealedEvent,
} from '../types'

/**
 * `NormalizedCheckEvent` factories for status-machine and merge tests, DERIVED
 * from the `rawLogs` builders: each base shape is a real raw log pushed through
 * the real decoder, so these can never drift from what `decodeLogs` actually
 * produces. Overrides express test intent on top.
 */

const decodeOne = <T extends NormalizedCheckEvent>(log: RawLog): T => {
  const [event] = decodeLogs([log])
  if (!event) throw new Error('checkEvents builder produced a log the decoder rejects')
  return event as T
}

export const proposedEvent = (over: Partial<OracleProposedEvent> = {}): OracleProposedEvent => ({
  ...decodeOne<OracleProposedEvent>(buildOracleProposedLog()),
  ...over,
})

export const attestedEvent = (over: Partial<OracleAttestedEvent> = {}): OracleAttestedEvent => ({
  ...decodeOne<OracleAttestedEvent>(buildOracleAttestedLog()),
  ...over,
})

export const plainProposedEvent = (over: Partial<PlainProposedEvent> = {}): PlainProposedEvent => ({
  ...decodeOne<PlainProposedEvent>(buildPlainProposedLog()),
  ...over,
})

export const plainAttestedEvent = (over: Partial<PlainAttestedEvent> = {}): PlainAttestedEvent => ({
  ...decodeOne<PlainAttestedEvent>(buildPlainAttestedLog()),
  ...over,
})

export const requestCreatedEvent = (over: Partial<RequestCreatedEvent> = {}): RequestCreatedEvent => ({
  ...decodeOne<RequestCreatedEvent>(buildNewRequestLog()),
  ...over,
})

export const sentinelCommittedEvent = (over: Partial<SentinelCommittedEvent> = {}): SentinelCommittedEvent => ({
  ...decodeOne<SentinelCommittedEvent>(buildCommittedLog()),
  ...over,
})

export const sentinelRevealedEvent = (over: Partial<SentinelRevealedEvent> = {}): SentinelRevealedEvent => ({
  ...decodeOne<SentinelRevealedEvent>(buildRevealedLog()),
  ...over,
})

export const oracleResultEvent = (over: Partial<OracleResultEvent> = {}): OracleResultEvent => ({
  ...decodeOne<OracleResultEvent>(buildOracleResultLog()),
  ...over,
})

export const disputeResolvedEvent = (over: Partial<DisputeResolvedEvent> = {}): DisputeResolvedEvent => ({
  ...decodeOne<DisputeResolvedEvent>(buildDisputeResolvedLog()),
  ...over,
})
