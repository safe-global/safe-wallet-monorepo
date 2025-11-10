import { configureStore } from '@reduxjs/toolkit'
import {
  hnStateSlice,
  setBannerDismissed,
  setFormCompleted,
  setPendingBannerDismissed,
  selectSafeHnState,
  type HnState,
} from '../hnStateSlice'

describe('hnStateSlice', () => {
  const createTestStore = (initialState: HnState = {}) => {
    return configureStore({
      reducer: {
        [hnStateSlice.name]: hnStateSlice.reducer,
      },
      preloadedState: {
        [hnStateSlice.name]: initialState,
      },
    })
  }

  describe('setBannerDismissed', () => {
    it('should set bannerDismissed to true for a new safe', () => {
      const store = createTestStore()
      const chainId = '1'
      const safeAddress = '0x123'

      store.dispatch(setBannerDismissed({ chainId, safeAddress, dismissed: true }))

      const state = store.getState()
      const safeState = selectSafeHnState(state, chainId, safeAddress)

      expect(safeState).toEqual({
        bannerDismissed: true,
        formCompleted: false,
        pendingBannerDismissed: false,
      })
    })

    it('should update bannerDismissed for an existing safe', () => {
      const initialState: HnState = {
        '1:0x123': {
          bannerDismissed: false,
          formCompleted: true,
          pendingBannerDismissed: true,
        },
      }
      const store = createTestStore(initialState)

      store.dispatch(setBannerDismissed({ chainId: '1', safeAddress: '0x123', dismissed: true }))

      const state = store.getState()
      const safeState = selectSafeHnState(state, '1', '0x123')

      expect(safeState).toEqual({
        bannerDismissed: true,
        formCompleted: true,
        pendingBannerDismissed: true,
      })
    })
  })

  describe('setFormCompleted', () => {
    it('should set formCompleted to true for a new safe', () => {
      const store = createTestStore()
      const chainId = '1'
      const safeAddress = '0x123'

      store.dispatch(setFormCompleted({ chainId, safeAddress, completed: true }))

      const state = store.getState()
      const safeState = selectSafeHnState(state, chainId, safeAddress)

      expect(safeState).toEqual({
        bannerDismissed: false,
        formCompleted: true,
        pendingBannerDismissed: false,
      })
    })

    it('should update formCompleted for an existing safe', () => {
      const initialState: HnState = {
        '1:0x123': {
          bannerDismissed: true,
          formCompleted: false,
          pendingBannerDismissed: true,
        },
      }
      const store = createTestStore(initialState)

      store.dispatch(setFormCompleted({ chainId: '1', safeAddress: '0x123', completed: true }))

      const state = store.getState()
      const safeState = selectSafeHnState(state, '1', '0x123')

      expect(safeState).toEqual({
        bannerDismissed: true,
        formCompleted: true,
        pendingBannerDismissed: true,
      })
    })
  })

  describe('setPendingBannerDismissed', () => {
    it('should set pendingBannerDismissed to true for a new safe', () => {
      const store = createTestStore()
      const chainId = '1'
      const safeAddress = '0x123'

      store.dispatch(setPendingBannerDismissed({ chainId, safeAddress, dismissed: true }))

      const state = store.getState()
      const safeState = selectSafeHnState(state, chainId, safeAddress)

      expect(safeState).toEqual({
        bannerDismissed: false,
        formCompleted: false,
        pendingBannerDismissed: true,
      })
    })

    it('should update pendingBannerDismissed for an existing safe', () => {
      const initialState: HnState = {
        '1:0x123': {
          bannerDismissed: true,
          formCompleted: true,
          pendingBannerDismissed: false,
        },
      }
      const store = createTestStore(initialState)

      store.dispatch(setPendingBannerDismissed({ chainId: '1', safeAddress: '0x123', dismissed: true }))

      const state = store.getState()
      const safeState = selectSafeHnState(state, '1', '0x123')

      expect(safeState).toEqual({
        bannerDismissed: true,
        formCompleted: true,
        pendingBannerDismissed: true,
      })
    })
  })

  describe('selectSafeHnState', () => {
    it('should return undefined for a safe that does not exist', () => {
      const store = createTestStore()
      const state = store.getState()
      const safeState = selectSafeHnState(state, '1', '0x123')

      expect(safeState).toBeUndefined()
    })

    it('should return the correct state for an existing safe', () => {
      const initialState: HnState = {
        '1:0x123': {
          bannerDismissed: true,
          formCompleted: true,
          pendingBannerDismissed: false,
        },
      }
      const store = createTestStore(initialState)
      const state = store.getState()
      const safeState = selectSafeHnState(state, '1', '0x123')

      expect(safeState).toEqual({
        bannerDismissed: true,
        formCompleted: true,
        pendingBannerDismissed: false,
      })
    })

    it('should handle different safe addresses correctly', () => {
      const initialState: HnState = {
        '1:0x123': {
          bannerDismissed: true,
          formCompleted: true,
          pendingBannerDismissed: false,
        },
        '1:0x456': {
          bannerDismissed: false,
          formCompleted: false,
          pendingBannerDismissed: true,
        },
      }
      const store = createTestStore(initialState)
      const state = store.getState()

      const safe1State = selectSafeHnState(state, '1', '0x123')
      const safe2State = selectSafeHnState(state, '1', '0x456')

      expect(safe1State).toEqual({
        bannerDismissed: true,
        formCompleted: true,
        pendingBannerDismissed: false,
      })
      expect(safe2State).toEqual({
        bannerDismissed: false,
        formCompleted: false,
        pendingBannerDismissed: true,
      })
    })
  })
})
