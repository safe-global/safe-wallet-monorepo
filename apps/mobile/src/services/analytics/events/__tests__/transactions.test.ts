import { 
  createTxConfirmEvent, 
  createTxCreateEvent, 
  createTxExecuteEvent, 
  createStakeViewedEvent,
  TRANSACTIONS_EVENTS 
} from '../transactions'
import { EventType } from '../../types'

describe('transactions events', () => {
  describe('TRANSACTIONS_EVENTS', () => {
    it('should have correct structure for STAKE_VIEWED', () => {
      expect(TRANSACTIONS_EVENTS.STAKE_VIEWED).toEqual({
        eventName: EventType.STAKE_VIEWED,
        eventCategory: 'transactions',
        eventAction: 'Stake viewed',
      })
    })
  })

  describe('createStakeViewedEvent', () => {
    it('should create correct event structure for Assets entry point', () => {
      const event = createStakeViewedEvent('Assets')

      expect(event).toEqual({
        eventName: EventType.STAKE_VIEWED,
        eventCategory: 'transactions',
        eventAction: 'Stake viewed',
        eventLabel: 'Assets',
      })
    })

    it('should create correct event structure for Transactions entry point', () => {
      const event = createStakeViewedEvent('Transactions')

      expect(event).toEqual({
        eventName: EventType.STAKE_VIEWED,
        eventCategory: 'transactions',
        eventAction: 'Stake viewed',
        eventLabel: 'Transactions',
      })
    })

    it('should create correct event structure for Sidebar entry point', () => {
      const event = createStakeViewedEvent('Sidebar')

      expect(event).toEqual({
        eventName: EventType.STAKE_VIEWED,
        eventCategory: 'transactions',
        eventAction: 'Stake viewed',
        eventLabel: 'Sidebar',
      })
    })
  })

  describe('existing transaction events', () => {
    it('should create tx confirm events with labels', () => {
      const event = createTxConfirmEvent('native_staking_deposit')
      expect(event.eventLabel).toBe('native_staking_deposit')
      expect(event.eventName).toBe(EventType.TX_CONFIRMED)
    })

    it('should create tx create events with labels', () => {
      const event = createTxCreateEvent('native_staking_exit')
      expect(event.eventLabel).toBe('native_staking_exit')
      expect(event.eventName).toBe(EventType.TX_CREATED)
    })

    it('should create tx execute events with labels', () => {
      const event = createTxExecuteEvent('native_staking_withdraw')
      expect(event.eventLabel).toBe('native_staking_withdraw')
      expect(event.eventName).toBe(EventType.TX_EXECUTED)
    })
  })
})