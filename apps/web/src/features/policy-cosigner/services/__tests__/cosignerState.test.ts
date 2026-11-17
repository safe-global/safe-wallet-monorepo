import { faker } from '@faker-js/faker'
import { fakerChecksummedAddress } from '@/tests/test-utils'
import {
  COSIGNATURE_UNVERIFIED,
  COSIGNER_REQUIREMENT_UNAVAILABLE,
  getQueuedCosignerNotice,
  getUnavailableState,
  isCosignerBlocking,
  isCosignerWaiting,
} from '../cosignerState'

describe('cosignerState', () => {
  const cosigner = fakerChecksummedAddress()

  describe('getQueuedCosignerNotice', () => {
    it('points to the queue when a new transaction is still waiting for the co-signer', () => {
      expect(getQueuedCosignerNotice({ status: 'pending', cosigner })).toEqual({
        variant: 'info',
        message:
          'The transaction was created and is waiting for the co-signer. Execute it from the queue once it is co-signed.',
      })
    })

    it('reports the rejection when the co-signer rejected the new transaction', () => {
      const reason = faker.lorem.sentence()

      const notice = getQueuedCosignerNotice({
        status: 'rejected',
        reason,
        ruleId: null,
        cosignerName: 'SAFE',
        cosigner,
      })

      expect(notice).toEqual({
        variant: 'error',
        message: `The transaction was created but can't be executed. The co-signer rejected this transaction: ${reason}`,
      })
    })
  })

  describe('getUnavailableState', () => {
    it('reports nothing when every read succeeded', () => {
      expect(getUnavailableState({ cosigner })).toBeUndefined()
    })

    it('reports an unknown requirement when the policy guard could not be read', () => {
      expect(getUnavailableState({ requirementError: new Error('rpc down'), cosigner })).toEqual({
        status: 'unavailable',
        reason: COSIGNER_REQUIREMENT_UNAVAILABLE,
      })
    })

    it('blames the service URL when the service answered with something other than JSON', () => {
      const state = getUnavailableState({ serviceError: { status: 'PARSING_ERROR' }, cosigner })

      expect(state).toEqual({
        status: 'unavailable',
        reason: "The co-signer service didn't answer with JSON. Check its URL in Settings › Environment variables.",
        cosigner,
      })
      expect(isCosignerBlocking(state)).toBe(true)
    })

    it('mentions CORS when the service could not be reached at all', () => {
      const state = getUnavailableState({ serviceError: { status: 'FETCH_ERROR', error: 'TypeError' }, cosigner })

      expect(state).toMatchObject({ status: 'unavailable', reason: expect.stringContaining('(CORS)') })
    })

    it('reports the HTTP status when the service answered with an error', () => {
      const state = getUnavailableState({ serviceError: { status: 500, data: {} }, cosigner })

      expect(state).toMatchObject({ reason: 'The co-signer service answered with an error (HTTP 500).' })
    })

    it('reports an unverified co-signature when the on-chain check failed', () => {
      expect(getUnavailableState({ verifyError: new Error('rpc down'), cosigner })).toEqual({
        status: 'unavailable',
        reason: COSIGNATURE_UNVERIFIED,
        cosigner,
      })
    })
  })

  describe('isCosignerWaiting', () => {
    it('treats a new transaction as waiting for the co-signer, not as blocked', () => {
      const state = { status: 'notProposed' as const, cosigner }

      expect(isCosignerWaiting(state)).toBe(true)
      expect(isCosignerBlocking(state)).toBe(false)
    })
  })
})
