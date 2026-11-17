import { faker } from '@faker-js/faker'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { fakerChecksummedAddress } from '@/tests/test-utils'
import { getCosignerCheck } from '../cosignerCheck'

describe('getCosignerCheck', () => {
  const cosigner = fakerChecksummedAddress()

  it('reports the signature as available once the co-signer signed', () => {
    const check = getCosignerCheck({
      status: 'ready',
      context: '0x',
      onchain: true,
      signer: cosigner,
      cosignerName: 'HYPERNATIVE',
      cosigner,
    })

    expect(check).toEqual({
      severity: Severity.OK,
      status: 'Signature available',
      description: 'The co-signer approved this transaction.',
      details: [
        { label: 'Co-signer', value: cosigner },
        { label: 'Reviewed by', value: 'Hypernative' },
      ],
    })
  })

  it('reports a rejection as critical with the reason and the rule', () => {
    const reason = faker.lorem.sentence()
    const ruleId = `rule_${faker.string.alphanumeric(8)}`

    const check = getCosignerCheck({ status: 'rejected', reason, ruleId, cosignerName: 'SAFE', cosigner })

    expect(check.severity).toBe(Severity.CRITICAL)
    expect(check.status).toBe('Rejected')
    expect(check.description).toBe(`The co-signer rejected this transaction: ${reason}`)
    expect(check.details).toContainEqual({ label: 'Rule', value: ruleId })
  })

  it('reports the co-signer as pending while the service reviews the transaction', () => {
    expect(getCosignerCheck({ status: 'pending', cosigner })).toMatchObject({
      severity: Severity.INFO,
      status: 'Waiting for the co-signer',
    })
  })

  it('tells the user a new transaction is sent to the co-signer once submitted', () => {
    expect(getCosignerCheck({ status: 'notProposed', cosigner })).toMatchObject({
      severity: Severity.INFO,
      status: 'Requested after you submit',
      description: 'The co-signer reviews this transaction once you submit it. Execution waits for its signature.',
    })
  })

  it('reports that a transaction outside the co-signed accesses needs no co-signature', () => {
    expect(getCosignerCheck({ status: 'notRequired' })).toMatchObject({
      severity: Severity.OK,
      status: 'Not required for this transaction',
      details: [],
    })
  })

  it('warns when the co-signer is unavailable, without a co-signer row when it is unknown', () => {
    const reason = faker.lorem.sentence()

    expect(getCosignerCheck({ status: 'unavailable', reason })).toEqual({
      severity: Severity.WARN,
      status: 'Co-signer unavailable',
      description: reason,
      details: [],
    })
  })

  it('warns that a failed review leaves the transaction without a co-signature', () => {
    expect(getCosignerCheck({ status: 'failed', reason: null, cosignerName: 'BLOCKAID', cosigner })).toMatchObject({
      severity: Severity.WARN,
      status: 'Review failed',
    })
  })
})
