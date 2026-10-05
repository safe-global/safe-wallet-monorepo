import {
  buildArbitrationTimedOutLog,
  buildCommittedLog,
  buildDisputeOutOfScopeLog,
  buildDisputeResolvedLog,
  buildDisputeTriggeredLog,
  buildNewRequestLog,
  buildOracleAttestedLog,
  buildOracleProposedLog,
  buildOracleResultLog,
  buildRequestTimedOutLog,
  buildRevealedLog,
} from './rawLogs'
import { decodeLogs, type RawLog } from '../utils/decodeLogs'
import type {
  ArbitrationTimedOutEvent,
  DisputeOutOfScopeEvent,
  DisputeResolvedEvent,
  DisputeTriggeredEvent,
  NormalizedCheckEvent,
  OracleAttestedEvent,
  OracleProposedEvent,
  OracleResultEvent,
  RequestCreatedEvent,
  RequestTimedOutEvent,
  SentinelCommittedEvent,
  SentinelRevealedEvent,
} from '../types'

/**
 * `NormalizedCheckEvent` factories for status-machine and snapshot tests,
 * DERIVED from the `rawLogs` builders: each base shape is a real raw log pushed
 * through the real decoder, so these can never drift from what `decodeLogs`
 * actually produces. Overrides express test intent on top.
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

export const disputeTriggeredEvent = (over: Partial<DisputeTriggeredEvent> = {}): DisputeTriggeredEvent => ({
  ...decodeOne<DisputeTriggeredEvent>(buildDisputeTriggeredLog()),
  ...over,
})

export const disputeResolvedEvent = (over: Partial<DisputeResolvedEvent> = {}): DisputeResolvedEvent => ({
  ...decodeOne<DisputeResolvedEvent>(buildDisputeResolvedLog()),
  ...over,
})

export const disputeOutOfScopeEvent = (over: Partial<DisputeOutOfScopeEvent> = {}): DisputeOutOfScopeEvent => ({
  ...decodeOne<DisputeOutOfScopeEvent>(buildDisputeOutOfScopeLog()),
  ...over,
})

export const arbitrationTimedOutEvent = (over: Partial<ArbitrationTimedOutEvent> = {}): ArbitrationTimedOutEvent => ({
  ...decodeOne<ArbitrationTimedOutEvent>(buildArbitrationTimedOutLog()),
  ...over,
})

export const requestTimedOutEvent = (over: Partial<RequestTimedOutEvent> = {}): RequestTimedOutEvent => ({
  ...decodeOne<RequestTimedOutEvent>(buildRequestTimedOutLog()),
  ...over,
})
