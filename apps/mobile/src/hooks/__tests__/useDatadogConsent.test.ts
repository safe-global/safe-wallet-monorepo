import { renderHook } from '@testing-library/react-native'
import { useDatadogConsent } from '../useDatadogConsent'

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}))

jest.mock('@/src/store/settingsSlice', () => ({
  selectDataCollectionConsented: jest.fn(),
}))

jest.mock('@/src/store/activeSafeSlice', () => ({
  selectActiveSafe: jest.fn(),
}))

const { useSelector } = require('react-redux')
const { DdSdkReactNative, TrackingConsent } = require('expo-datadog')

describe('useDatadogConsent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should set tracking consent to GRANTED when dataCollectionConsented is true', () => {
    let callIndex = 0
    useSelector.mockImplementation(() => {
      callIndex++
      // First call: selectDataCollectionConsented, Second: selectActiveSafe
      return callIndex === 1 ? true : null
    })

    renderHook(() => useDatadogConsent())

    expect(DdSdkReactNative.setTrackingConsent).toHaveBeenCalledWith(TrackingConsent.GRANTED)
  })

  it('should set tracking consent to NOT_GRANTED when dataCollectionConsented is false', () => {
    let callIndex = 0
    useSelector.mockImplementation(() => {
      callIndex++
      return callIndex === 1 ? false : null
    })

    renderHook(() => useDatadogConsent())

    expect(DdSdkReactNative.setTrackingConsent).toHaveBeenCalledWith(TrackingConsent.NOT_GRANTED)
  })

  it('should set DD user when consented and activeSafe has an address', () => {
    let callIndex = 0
    useSelector.mockImplementation(() => {
      callIndex++
      return callIndex === 1 ? true : { address: '0xABC123', chainId: '1' }
    })

    renderHook(() => useDatadogConsent())

    expect(DdSdkReactNative.addUserExtraInfo).toHaveBeenCalledWith({
      safeAddress: '0xABC123',
      chainId: '1',
    })
  })

  it('should not set DD user when not consented', () => {
    let callIndex = 0
    useSelector.mockImplementation(() => {
      callIndex++
      return callIndex === 1 ? false : { address: '0xABC123', chainId: '1' }
    })

    renderHook(() => useDatadogConsent())

    expect(DdSdkReactNative.addUserExtraInfo).not.toHaveBeenCalled()
  })

  it('should not set DD user when activeSafe is null', () => {
    let callIndex = 0
    useSelector.mockImplementation(() => {
      callIndex++
      return callIndex === 1 ? true : null
    })

    renderHook(() => useDatadogConsent())

    expect(DdSdkReactNative.addUserExtraInfo).not.toHaveBeenCalled()
  })
})
