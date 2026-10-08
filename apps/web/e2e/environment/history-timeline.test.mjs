import assert from 'node:assert/strict'
import { test } from 'node:test'
import { timelineDate } from '../../cypress/support/history-timeline.js'

const at = (iso) => Date.parse(iso)
const timeline = [
  [at('2023-11-30T10:00:00Z'), at('2026-10-08T12:00:00Z')],
  [at('2023-11-30T12:00:00Z'), at('2026-10-08T12:00:10Z')],
]

test('keeps staging dates when no history was rebuilt', () => {
  assert.equal(timelineDate('2023-11-30T11:00:00Z', []), '2023-11-30T11:00:00Z')
})

test('maps staging dates between two executions proportionally', () => {
  assert.equal(timelineDate('2023-11-30T11:00:00Z', timeline), '2026-10-08T12:00:05.000Z')
  assert.equal(timelineDate('2023-11-30T10:00:00Z', timeline), '2026-10-08T12:00:00.000Z')
})

test('shifts staging dates before the first or after the last execution by the same distance', () => {
  assert.equal(timelineDate('2023-11-30T09:59:00Z', timeline), '2026-10-08T11:59:00.000Z')
  assert.equal(timelineDate('2023-11-30T12:01:00Z', timeline), '2026-10-08T12:01:10.000Z')
})
