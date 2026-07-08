import { act, renderHook } from '@/tests/test-utils'
import useSafeAppsInfoModal from './useSafeAppsInfoModal'
import { useBrowserPermissions } from '@/hooks/safe-apps/permissions'
import { PermissionStatus } from '../types'
import type { AllowedFeatures } from '../types'

jest.mock('@/hooks/useChainId', () => jest.fn(() => '11155111'))

const APP_URL = 'https://safe-test-app.com'
const FEATURES = ['camera', 'microphone'] as AllowedFeatures[]

const renderModalWithPermissions = () =>
  renderHook(() => {
    const { addPermissions, getPermissions, permissions } = useBrowserPermissions()
    const modal = useSafeAppsInfoModal({
      url: APP_URL,
      permissions: FEATURES,
      addPermissions,
      getPermissions,
      remoteSafeAppsLoading: false,
    })
    return { modal, permissions }
  })

describe('useSafeAppsInfoModal', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('reports the permissions review as incomplete when the app has ungranted features', () => {
    const { result } = renderModalWithPermissions()

    expect(result.current.modal.isPermissionsReviewCompleted).toBe(false)
  })

  it('stores the granted and denied browser permissions on complete', () => {
    const { result } = renderModalWithPermissions()

    act(() => {
      result.current.modal.onComplete(false, [
        { feature: 'camera', status: PermissionStatus.GRANTED },
        { feature: 'microphone', status: PermissionStatus.DENIED },
      ])
    })

    expect(result.current.permissions[APP_URL]).toEqual([
      { feature: 'camera', status: PermissionStatus.GRANTED },
      { feature: 'microphone', status: PermissionStatus.DENIED },
    ])
  })

  it('reports the permissions review as completed once every feature is granted or denied', () => {
    const { result } = renderModalWithPermissions()

    act(() => {
      result.current.modal.onComplete(false, [
        { feature: 'camera', status: PermissionStatus.GRANTED },
        { feature: 'microphone', status: PermissionStatus.DENIED },
      ])
    })

    expect(result.current.modal.isPermissionsReviewCompleted).toBe(true)
  })

  it('marks the consent as accepted on complete', () => {
    const { result } = renderModalWithPermissions()

    act(() => {
      result.current.modal.onComplete(false, [
        { feature: 'camera', status: PermissionStatus.GRANTED },
        { feature: 'microphone', status: PermissionStatus.GRANTED },
      ])
    })

    expect(result.current.modal.isConsentAccepted).toBe(true)
  })
})
