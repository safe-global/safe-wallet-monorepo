import { id } from 'ethers'
import { decodeCustomError, extractRevertSelector, getKnownCustomError } from '../customErrorRegistry'

describe('customErrorRegistry', () => {
  describe('getKnownCustomError', () => {
    it('derives the Hypernative guard UnapprovedHash selector from its ABI', () => {
      // The selector previously hardcoded as GUARD_ERROR_CODES.UNAPPROVED_HASH
      expect(getKnownCustomError('0x70cc6907')).toEqual({ name: 'UnapprovedHash', source: 'Hypernative guard' })
    })

    it('derives Safe 4337 module error selectors', () => {
      const selector = id('InvalidEntryPoint()').slice(0, 10)
      expect(getKnownCustomError(selector)).toEqual({ name: 'InvalidEntryPoint', source: 'Safe 4337 module' })
    })

    it('derives Zodiac Roles module error selectors', () => {
      const selector = id('ModuleTransactionFailed()').slice(0, 10)
      expect(getKnownCustomError(selector)).toEqual({ name: 'ModuleTransactionFailed', source: 'Zodiac Roles module' })
    })

    it('is case-insensitive and returns undefined for unknown selectors', () => {
      expect(getKnownCustomError('0x70CC6907')).toEqual({ name: 'UnapprovedHash', source: 'Hypernative guard' })
      expect(getKnownCustomError('0xdeadbeef')).toBeUndefined()
    })
  })

  describe('extractRevertSelector', () => {
    it('reads structured revert data from an ethers CALL_EXCEPTION', () => {
      const error = Object.assign(new Error('execution reverted (unknown custom error)'), {
        code: 'CALL_EXCEPTION',
        data: '0x70cc6907',
      })
      expect(extractRevertSelector(error)).toBe('0x70cc6907')
    })

    it('extracts a selector explicitly framed as a custom error or revert signature', () => {
      expect(extractRevertSelector(new Error('execution reverted with an unrecognized custom error 0x70cc6907'))).toBe(
        '0x70cc6907',
      )
      expect(extractRevertSelector(new Error('reverted with the following signature:\n0x70cc6907'))).toBe('0x70cc6907')
    })

    it('never matches longer hex blobs (addresses, hashes, calldata)', () => {
      const error = new Error(
        'execution reverted: custom error 0x34FFB6b99ea51154Be584FA091709Fee7bb89471 with data 0x6a76120200000000',
      )
      expect(extractRevertSelector(error)).toBeUndefined()
    })

    it('never treats a coincidental 8-hex value in revert text as a selector', () => {
      // Reviewer fixture (BUG-001): gas price 0x3b9aca00 = 1 gwei — a real
      // value an RPC can embed in a "misleadingly wrapped as revert" message
      const error = new Error(
        'The contract function "execTransaction" reverted with the following reason:\nreplacement transaction underpriced: existing tx with gasPrice 0x3b9aca00 needs at least 0x77359400',
      )
      expect(extractRevertSelector(error)).toBeUndefined()
    })

    it('ignores unframed selectors and empty inputs', () => {
      expect(extractRevertSelector(new Error('request 0x70cc6907 failed with HTTP 500'))).toBeUndefined()
      expect(extractRevertSelector(new Error('execution reverted at 0x70cc6907'))).toBeUndefined()
      expect(extractRevertSelector(undefined)).toBeUndefined()
      expect(extractRevertSelector(null)).toBeUndefined()
    })
  })

  describe('decodeCustomError', () => {
    it('returns undefined for standard string/panic reverts (e.g. the GS013 require itself)', () => {
      const stringRevert = Object.assign(new Error('execution reverted: "GS013"'), {
        code: 'CALL_EXCEPTION',
        // Error(string) selector followed by the ABI-encoded "GS013" reason
        data: '0x08c379a0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000054753303133000000000000000000000000000000000000000000000000000000',
      })
      expect(decodeCustomError(stringRevert)).toBeUndefined()
    })

    it('decodes a known custom error', () => {
      const error = Object.assign(new Error('execution reverted (unknown custom error)'), {
        code: 'CALL_EXCEPTION',
        data: '0x70cc6907',
      })
      expect(decodeCustomError(error)).toEqual({
        selector: '0x70cc6907',
        name: 'UnapprovedHash',
        source: 'Hypernative guard',
      })
    })

    it('keeps the raw selector for an undecodable custom error', () => {
      const error = Object.assign(new Error('execution reverted (unknown custom error)'), {
        code: 'CALL_EXCEPTION',
        data: '0xdeadbeef',
      })
      expect(decodeCustomError(error)).toEqual({ selector: '0xdeadbeef' })
    })
  })
})
