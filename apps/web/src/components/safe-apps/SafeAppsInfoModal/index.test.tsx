import { act, fireEvent, render, screen } from '@/tests/test-utils'
import SafeAppsInfoModal from '.'
import { PermissionStatus } from '../types'
import type { AllowedFeatures } from '../types'

const defaultProps = {
  onCancel: jest.fn(),
  onConfirm: jest.fn(),
  features: ['camera', 'microphone'] as AllowedFeatures[],
  appUrl: 'https://safe-test-app.com',
  isConsentAccepted: true,
  isPermissionsReviewCompleted: false,
  isSafeAppInDefaultList: true,
  isFirstTimeAccessingApp: false,
}

describe('SafeAppsInfoModal', () => {
  it('renders a checkbox for each requested browser feature', () => {
    render(<SafeAppsInfoModal {...defaultProps} />)

    expect(screen.getByRole('checkbox', { name: /camera/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /microphone/i })).toBeInTheDocument()
  })

  it('checks all requested features by default', () => {
    render(<SafeAppsInfoModal {...defaultProps} />)

    expect(screen.getByRole('checkbox', { name: /camera/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /microphone/i })).toBeChecked()
  })

  it('confirms with all features granted when the selection is unchanged', () => {
    const onConfirm = jest.fn()
    render(<SafeAppsInfoModal {...defaultProps} onConfirm={onConfirm} />)

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    })

    expect(onConfirm).toHaveBeenCalledWith(false, [
      { feature: 'camera', status: PermissionStatus.GRANTED },
      { feature: 'microphone', status: PermissionStatus.GRANTED },
    ])
  })

  it('marks a feature as denied when its checkbox is unchecked before confirming', () => {
    const onConfirm = jest.fn()
    render(<SafeAppsInfoModal {...defaultProps} onConfirm={onConfirm} />)

    act(() => {
      fireEvent.click(screen.getByRole('checkbox', { name: /microphone/i }))
    })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    })

    expect(onConfirm).toHaveBeenCalledWith(false, [
      { feature: 'camera', status: PermissionStatus.GRANTED },
      { feature: 'microphone', status: PermissionStatus.DENIED },
    ])
  })

  it('does not render the features slide once the permissions review is completed', () => {
    render(<SafeAppsInfoModal {...defaultProps} isPermissionsReviewCompleted={true} />)

    expect(screen.queryByRole('checkbox', { name: /camera/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /microphone/i })).not.toBeInTheDocument()
  })
})
