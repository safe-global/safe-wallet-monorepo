import MockDate from 'mockdate'
import * as router from 'next/router'

import type { TxFilterType } from '@/utils/tx-history-filter'
import {
  txFilter,
  _isValidTxFilterType,
  _omitNullish,
  useTxFilter,
  _isModuleFilter,
  type TxFilter,
  fetchFilteredTxHistory,
} from '@/utils/tx-history-filter'
import { renderHook } from '@/tests/test-utils'
import type { NextRouter } from 'next/router'
import { type TxFilterFormState } from '@/components/transactions/TxFilterForm'
import * as transactionUtils from '@/utils/transactions'

MockDate.set('2021-01-01T00:00:00.000Z')

jest.mock('@/utils/transactions', () => ({
  getIncomingTransfers: jest.fn(() => Promise.resolve({ results: [] })),
  getMultisigTransactions: jest.fn(() => Promise.resolve({ results: [] })),
  getOutgoingTransfers: jest.fn(() => Promise.resolve({ results: [] })),
  getModuleTransactions: jest.fn(() => Promise.resolve({ results: [] })),
}))

const SAFE = '0xA73047Ab98C1BB6AeA090AD9dc362E5462F6765F'
const RECIPIENT = '0x23cbCbbC748c961E570Cfc05Ff65554ECB8955E9'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

describe('tx-history-filter', () => {
  describe('_omitNullish', () => {
    it('should keep truthy values', () => {
      const result1 = _omitNullish({
        execution_date__gte: '1970-01-01T00:00:00.000Z',
        value: '123000000000000000000',
        type: 'Incoming',
      })

      expect(result1).toEqual({
        execution_date__gte: '1970-01-01T00:00:00.000Z',
        value: '123000000000000000000',
        type: 'Incoming',
      })

      const result2 = _omitNullish({
        execution_date__gte: new Date('1970-01-01'),
        outgoing: 'Incoming',
        executed: true,
      })

      expect(result2).toEqual({
        execution_date__gte: new Date('1970-01-01'),
        outgoing: 'Incoming',
        executed: true,
      })
    })

    it('should remove `null`, `undefined`,  and empty strings', () => {
      const result = _omitNullish({
        emptyString: '',
        undefinedValue: undefined,
        nullValue: null,
        hello: 'world',
        falseValue: false,
      })

      expect(result).toEqual({
        hello: 'world',
        falseValue: false,
      })
    })
  })

  describe('isValidTxFilterType', () => {
    it('should return `true` for valid filter `type`s', () => {
      const result1 = _isValidTxFilterType('Incoming')
      expect(result1).toBe(true)

      const result2 = _isValidTxFilterType('Outgoing')
      expect(result2).toBe(true)

      const result3 = _isValidTxFilterType('Module-based')
      expect(result3).toBe(true)
    })

    it('should return `false` for invalid filter `type`s', () => {
      const result1 = _isValidTxFilterType('Test')
      expect(result1).toBe(false)

      const result2 = _isValidTxFilterType('')
      expect(result2).toBe(false)

      const result3 = _isValidTxFilterType(undefined)
      expect(result3).toBe(false)
    })
  })

  describe('isModuleFilter', () => {
    it('returns `true` for module filters', () => {
      const filter: TxFilter['filter'] = {
        module: '0x123',
        to: '0x123',
      }
      const result = _isModuleFilter(filter)

      expect(result).toBe(true)
    })

    it('returns `false` for incoming filters', () => {
      const filter: TxFilter['filter'] = {
        execution_date__gte: '1970-01-01T00:00:00.000Z',
        execution_date__lte: '2000-01-01T00:00:00.000Z',
        to: '0x1234567890123456789012345678901234567890',
        token_address: '0x1234567890123456789012345678901234567890',
        value: '123000000000000000000',
      }
      const result1 = _isModuleFilter(filter)

      expect(result1).toBe(false)
    })

    it('returns `false` for multisig filters', () => {
      const filter: TxFilter['filter'] = {
        execution_date__gte: '1970-01-01T00:00:00.000Z',
        execution_date__lte: '2000-01-01T00:00:00.000Z',
        to: '0x1234567890123456789012345678901234567890',
        value: '123000000000000000000',
        nonce: '123',
        executed: 'true',
      }
      const result1 = _isModuleFilter(filter)

      expect(result1).toBe(false)
    })
  })

  describe('txFilter', () => {
    describe('parseUrlQuery', () => {
      it('should return incoming filters', () => {
        const result = txFilter.parseUrlQuery({
          execution_date__gte: '1970-01-01T00:00:00.000Z',
          value: '123000000000000000000',
          type: 'Incoming',
        })

        expect(result).toEqual({
          type: 'Incoming',
          filter: {
            execution_date__gte: '1970-01-01T00:00:00.000Z',
            value: '123000000000000000000',
          },
        })
      })

      it('should return multisig filters', () => {
        const result = txFilter.parseUrlQuery({
          to: '0x1234567890123456789012345678901234567890',
          execution_date__gte: '1970-01-01T00:00:00.000Z',
          execution_date__lte: '2000-01-01T00:00:00.000Z',
          value: '123000000000000000000',
          nonce: '123',
          type: 'Outgoing',
          executed: 'true',
        })

        expect(result).toEqual({
          type: 'Outgoing',
          filter: {
            to: '0x1234567890123456789012345678901234567890',
            execution_date__gte: '1970-01-01T00:00:00.000Z',
            execution_date__lte: '2000-01-01T00:00:00.000Z',
            value: '123000000000000000000',
            nonce: '123',
            executed: 'true',
          },
        })
      })

      it('should return module filters', () => {
        const result = txFilter.parseUrlQuery({
          to: '0x1234567890123456789012345678901234567890',
          module: '0x1234567890123456789012345678901234567890',
          type: 'Module-based',
        })

        expect(result).toEqual({
          type: 'Module-based',
          filter: {
            to: '0x1234567890123456789012345678901234567890',
            module: '0x1234567890123456789012345678901234567890',
          },
        })
      })

      it('should return `null` for missing or incorrect `type`s', () => {
        const result1 = txFilter.parseUrlQuery({
          type: 'Fake',
        })
        expect(result1).toEqual(null)

        const result2 = txFilter.parseUrlQuery({
          type: '',
        })
        expect(result2).toEqual(null)

        const result3 = txFilter.parseUrlQuery({})
        expect(result3).toEqual(null)
      })
    })

    describe('parseFormData', () => {
      it('should return incoming filters', () => {
        const result = txFilter.parseFormData({
          execution_date__gte: new Date('1970-01-01'),
          value: '123000000000000000000',
          type: 'Incoming' as TxFilterType,
        } as TxFilterFormState)

        expect(result).toEqual({
          type: 'Incoming',
          filter: {
            execution_date__gte: '1969-12-31T23:00:00.000Z',
            value: '123000000000000000000',
          },
        })
      })

      it('should return multisig filters', () => {
        const result = txFilter.parseFormData({
          to: '0x1234567890123456789012345678901234567890',
          execution_date__gte: new Date('1970-01-01'),
          execution_date__lte: null,
          value: '123',
          nonce: '123',
          type: 'Outgoing' as TxFilterType,
        } as TxFilterFormState)

        expect(result).toEqual({
          type: 'Outgoing',
          filter: {
            to: '0x1234567890123456789012345678901234567890',
            execution_date__gte: '1969-12-31T23:00:00.000Z',
            value: '123',
            nonce: '123',
          },
        })
      })

      it('keeps the transfers flag when the form has the toggle on', () => {
        const result = txFilter.parseFormData({
          to: RECIPIENT,
          transfers: true,
          type: 'Outgoing' as TxFilterType,
        } as TxFilterFormState)

        expect(result).toEqual({ type: 'Outgoing', filter: { to: RECIPIENT, transfers: 'true' } })
      })

      it('leaves the transfers flag out when the form has the toggle off', () => {
        const result = txFilter.parseFormData({
          to: RECIPIENT,
          transfers: false,
          type: 'Outgoing' as TxFilterType,
        } as TxFilterFormState)

        expect(result).toEqual({ type: 'Outgoing', filter: { to: RECIPIENT } })
      })

      it('should return module filters', () => {
        const result = txFilter.parseFormData({
          to: '0x1234567890123456789012345678901234567890',
          module: '0x1234567890123456789012345678901234567890',
          type: 'Module-based',
        } as TxFilterFormState)

        expect(result).toEqual({
          type: 'Module-based',
          filter: {
            to: '0x1234567890123456789012345678901234567890',
            module: '0x1234567890123456789012345678901234567890',
          },
        })
      })
    })

    describe('formatUrlQuery', () => {
      it('should return a URL query formatted', () => {
        const result = txFilter.formatUrlQuery({
          type: 'Outgoing' as TxFilterType,
          filter: {
            execution_date__gte: '1970-01-01T00:00:00.000Z',
            value: '123000000000000000000',
            nonce: '123',
            executed: 'true',
          },
        })

        expect(result).toEqual({
          type: 'Outgoing',
          execution_date__gte: '1970-01-01T00:00:00.000Z',
          value: '123000000000000000000',
          nonce: '123',
          executed: 'true',
        })
      })
    })

    describe('formatFormData', () => {
      it('should drop a date that cannot be parsed', () => {
        const result = txFilter.formatFormData({
          type: 'Outgoing' as TxFilterType,
          filter: {
            execution_date__gte: 'not-a-date',
            execution_date__lte: '1970-01-01T00:00:00.000Z',
          },
        })

        expect(result.execution_date__gte).toBeNull()
        expect(result.execution_date__lte).toEqual(new Date('1970-01-01'))
      })

      it('should return a form formatted filter', () => {
        const result = txFilter.formatFormData({
          type: 'Outgoing' as TxFilterType,
          filter: {
            execution_date__gte: '1970-01-01T00:00:00.000Z',
            value: '123',
            nonce: '123',
          },
        })

        expect(result).toEqual({
          type: 'Outgoing',
          execution_date__gte: new Date('1970-01-01'),
          execution_date__lte: null,
          value: '123',
          nonce: '123',
          transfers: false,
        })
      })

      it('turns the toggle on for an outgoing filter with the transfers flag', () => {
        const result = txFilter.formatFormData({
          type: 'Outgoing' as TxFilterType,
          filter: { transfers: 'true', token_address: USDC },
        })

        expect(result.transfers).toBe(true)
        expect(result.token_address).toBe(USDC)
      })

      it('keeps the toggle off for an incoming filter with the transfers flag', () => {
        const result = txFilter.formatFormData({
          type: 'Incoming' as TxFilterType,
          filter: { transfers: 'true' } as TxFilter['filter'],
        })

        expect(result.transfers).toBe(false)
      })
    })
  })

  describe('useTxFilter', () => {
    it('returns the current filter from the URL query', () => {
      jest.spyOn(router, 'useRouter').mockReturnValue({
        query: {
          type: 'Outgoing',
          execution_date__gte: '1970-01-01T00:00:00.000Z',
        },
      } as unknown as NextRouter)

      const { result } = renderHook(() => useTxFilter())

      expect(result.current[0]).toEqual({
        type: 'Outgoing',
        filter: { execution_date__gte: '1970-01-01T00:00:00.000Z' },
      })
    })

    it('sets the filter in the URL query', () => {
      const mockPush = jest.fn()
      jest.spyOn(router, 'useRouter').mockReturnValue({
        push: mockPush,
        query: {
          safe: '0x123',
        },
        pathname: '/test',
      } as unknown as NextRouter)

      const { result } = renderHook(() => useTxFilter())

      result.current[1]({
        type: 'Outgoing' as TxFilterType,
        filter: { execution_date__gte: '1970-01-01T00:00:00.000Z' },
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/test',
        query: {
          safe: '0x123',
          type: 'Outgoing',
          execution_date__gte: '1970-01-01T00:00:00.000Z',
        },
      })
    })

    it('remove the URL query filter', () => {
      const mockPush = jest.fn()
      jest.spyOn(router, 'useRouter').mockReturnValue({
        push: mockPush,
        query: {
          safe: '0x123',
          type: 'Outgoing',
          execution_date__gte: '1970-01-01T00:00:00.000Z',
        },
        pathname: '/test',
      } as unknown as NextRouter)

      const { result } = renderHook(() => useTxFilter())

      result.current[1](null)

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/test',
        query: {
          safe: '0x123',
        },
      })
    })
  })

  describe('fetchFilteredTxHistory', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should get incoming transfers relevant to `type`', () => {
      fetchFilteredTxHistory(
        '4',
        '0x123',
        { type: 'Incoming' as TxFilterType, filter: { value: '123' } },
        false,
        false,
        'pageUrl1',
      )

      expect(transactionUtils.getIncomingTransfers).toHaveBeenCalledWith(
        '4',
        '0x123',
        {
          trusted: false,
          execution_date__gte: undefined,
          execution_date__lte: undefined,
          to: undefined,
          value: '123',
          token_address: undefined,
        },
        'pageUrl1',
      )

      expect(transactionUtils.getMultisigTransactions).not.toHaveBeenCalled()
      expect(transactionUtils.getModuleTransactions).not.toHaveBeenCalled()
    })

    it('should get outgoing transfers relevant to `type`', () => {
      fetchFilteredTxHistory(
        '100',
        '0x456',
        {
          type: 'Outgoing' as TxFilterType,
          filter: { execution_date__gte: '1970-01-01T00:00:00.000Z', executed: 'true' },
        },
        false,
        false,
        'pageUrl2',
      )

      expect(transactionUtils.getMultisigTransactions).toHaveBeenCalledWith(
        '100',
        '0x456',
        {
          execution_date__gte: '1970-01-01T00:00:00.000Z',
          execution_date__lte: undefined,
          to: undefined,
          value: undefined,
          nonce: undefined,
          executed: 'true',
        },
        'pageUrl2',
      )

      expect(transactionUtils.getIncomingTransfers).not.toHaveBeenCalled()
      expect(transactionUtils.getModuleTransactions).not.toHaveBeenCalled()
      expect(transactionUtils.getOutgoingTransfers).not.toHaveBeenCalled()
    })

    it('gets outgoing transfers when an outgoing filter has the transfers flag', () => {
      const hideUntrustedTxs = true

      fetchFilteredTxHistory(
        '1',
        SAFE,
        {
          type: 'Outgoing' as TxFilterType,
          filter: {
            transfers: 'true',
            execution_date__gte: '1970-01-01T00:00:00.000Z',
            to: RECIPIENT,
            token_address: USDC,
          },
        },
        hideUntrustedTxs,
        false,
        'pageUrl4',
      )

      expect(transactionUtils.getOutgoingTransfers).toHaveBeenCalledWith(
        '1',
        SAFE,
        {
          trusted: true,
          execution_date__gte: '1970-01-01T00:00:00.000Z',
          execution_date__lte: undefined,
          to: RECIPIENT,
          token_address: USDC,
        },
        'pageUrl4',
      )
      expect(transactionUtils.getMultisigTransactions).not.toHaveBeenCalled()
    })

    it('sends the recipient and the token without the chain prefix', () => {
      fetchFilteredTxHistory(
        '1',
        SAFE,
        {
          type: 'Outgoing' as TxFilterType,
          filter: { transfers: 'true', to: `eth:${RECIPIENT}`, token_address: `eth:${USDC}` },
        },
        false,
        false,
      )

      expect(transactionUtils.getOutgoingTransfers).toHaveBeenCalledWith(
        '1',
        SAFE,
        expect.objectContaining({ to: RECIPIENT, token_address: USDC }),
        undefined,
      )
    })

    it('ignores the transfers flag on an incoming filter', () => {
      fetchFilteredTxHistory(
        '1',
        SAFE,
        { type: 'Incoming' as TxFilterType, filter: { transfers: 'true' } as TxFilter['filter'] },
        false,
        false,
      )

      expect(transactionUtils.getIncomingTransfers).toHaveBeenCalled()
      expect(transactionUtils.getOutgoingTransfers).not.toHaveBeenCalled()
    })

    it('should get module transfers relevant to `type`', () => {
      fetchFilteredTxHistory(
        '1',
        '0x789',
        { type: 'Module-based' as TxFilterType, filter: { to: '0x123' } },
        false,
        false,
        'pageUrl3',
      )

      expect(transactionUtils.getModuleTransactions).toHaveBeenCalledWith(
        '1',
        '0x789',
        {
          to: '0x123',
          module: undefined,
          transaction_hash: undefined,
        },
        'pageUrl3',
      )

      expect(transactionUtils.getIncomingTransfers).not.toHaveBeenCalled()
      expect(transactionUtils.getMultisigTransactions).not.toHaveBeenCalled()
    })

    it('should return undefined if invalid `type`', () => {
      fetchFilteredTxHistory(
        '1',
        '0x789',
        {
          type: 'Test' as TxFilterType,
          filter: { token_address: '0x123' },
        },
        false,
        false,
        'pageUrl3',
      )

      expect(transactionUtils.getIncomingTransfers).not.toHaveBeenCalled()
      expect(transactionUtils.getIncomingTransfers).not.toHaveBeenCalled()
      expect(transactionUtils.getMultisigTransactions).not.toHaveBeenCalled()
    })
  })
})
