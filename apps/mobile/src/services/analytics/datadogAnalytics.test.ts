import { DdRum } from 'expo-datadog'
import {
  trackDatadogView,
  stopActiveDatadogView,
  resumeActiveDatadogView,
  __resetDatadogViewStateForTests,
} from './datadogAnalytics'

const startView = DdRum.startView as jest.Mock
const stopView = DdRum.stopView as jest.Mock

describe('datadogAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    __resetDatadogViewStateForTests()
  })

  describe('trackDatadogView', () => {
    it('starts a view and does not stop a previous one on first navigation', () => {
      trackDatadogView('/home', '/home')

      expect(startView).toHaveBeenCalledWith('/home', '/home')
      expect(stopView).not.toHaveBeenCalled()
    })

    it('stops the previous view before starting a new one on navigation', () => {
      trackDatadogView('/home', '/home')
      trackDatadogView('/settings', '/settings')

      expect(stopView).toHaveBeenCalledTimes(1)
      expect(stopView).toHaveBeenCalledWith('/home')
      expect(startView).toHaveBeenLastCalledWith('/settings', '/settings')
    })
  })

  describe('stopActiveDatadogView', () => {
    it('stops the active view once', () => {
      trackDatadogView('/home', '/home')
      stopView.mockClear()

      stopActiveDatadogView()

      expect(stopView).toHaveBeenCalledTimes(1)
      expect(stopView).toHaveBeenCalledWith('/home')
    })

    it('is a no-op when there is no view', () => {
      stopActiveDatadogView()
      expect(stopView).not.toHaveBeenCalled()
    })

    it('is a no-op when the view is already stopped', () => {
      trackDatadogView('/home', '/home')
      stopActiveDatadogView()
      stopView.mockClear()

      stopActiveDatadogView()

      expect(stopView).not.toHaveBeenCalled()
    })
  })

  describe('resumeActiveDatadogView', () => {
    it('restarts the last view with the reused key', () => {
      trackDatadogView('/home', '/home')
      stopActiveDatadogView()
      startView.mockClear()

      resumeActiveDatadogView()

      expect(startView).toHaveBeenCalledTimes(1)
      expect(startView).toHaveBeenCalledWith('/home', '/home')
    })

    it('is a no-op when the view is already active', () => {
      trackDatadogView('/home', '/home')
      startView.mockClear()

      resumeActiveDatadogView()

      expect(startView).not.toHaveBeenCalled()
    })

    it('is a no-op when no view has been tracked', () => {
      resumeActiveDatadogView()
      expect(startView).not.toHaveBeenCalled()
    })
  })

  it('track -> background -> resume issues exactly one stop and one fresh start', () => {
    trackDatadogView('/transactions', '/transactions')
    jest.clearAllMocks()

    stopActiveDatadogView()
    resumeActiveDatadogView()

    expect(stopView).toHaveBeenCalledTimes(1)
    expect(stopView).toHaveBeenCalledWith('/transactions')
    expect(startView).toHaveBeenCalledTimes(1)
    expect(startView).toHaveBeenCalledWith('/transactions', '/transactions')
  })
})
