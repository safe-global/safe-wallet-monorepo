import { fixtureValue } from '../support/fixture.js'
import { timelineDate } from '../support/history-timeline.js'

export default {
  date: (value) => timelineDate(value, fixtureValue('history.timeline', [])),
}
