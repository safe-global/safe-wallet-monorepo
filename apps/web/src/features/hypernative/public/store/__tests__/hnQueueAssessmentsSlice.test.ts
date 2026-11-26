import { faker } from '@faker-js/faker'
import { makeStore } from '@/store'
import { selectAssessmentsByHashes, setBatchAssessments } from '../hnQueueAssessmentsSlice'
import { hnSessionRejected, hnSessionRejectionCleared } from '../hnSessionSlice'

describe('hnQueueAssessmentsSlice', () => {
  it('drops the assessments of a rejected session once the user signs in again', () => {
    const store = makeStore()
    const failedHash = faker.string.hexadecimal({ length: 64, casing: 'lower' }) as `0x${string}`
    store.dispatch(setBatchAssessments({ [failedHash]: null }))
    store.dispatch(hnSessionRejected(`Bearer ${faker.string.alphanumeric(40)}`))

    store.dispatch(hnSessionRejectionCleared())

    expect(selectAssessmentsByHashes(store.getState(), [failedHash])).toEqual({})
  })
})
