import type { Meta, StoryObj } from '@storybook/react'
import SafeAppsInfoModal from './index'
import type { AllowedFeatures } from '../types'

const meta = {
  title: 'Components/SafeApps/SafeAppsInfoModal',
  component: SafeAppsInfoModal,
  parameters: {
    componentSubtitle: 'Consent, browser permissions and unknown-app warning steps shown before a Safe App loads',
    layout: 'fullscreen',
  },
  args: {
    onCancel: () => {},
    onConfirm: () => {},
    features: ['camera', 'microphone'] as AllowedFeatures[],
    appUrl: 'https://safe-test-app.com',
    isConsentAccepted: true,
    isPermissionsReviewCompleted: true,
    isSafeAppInDefaultList: true,
    isFirstTimeAccessingApp: false,
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SafeAppsInfoModal>

export default meta
type Story = StoryObj<typeof meta>

export const Permissions: Story = {
  args: {
    isPermissionsReviewCompleted: false,
  },
}

// A manifest may request any of the 31 `FEATURES`.
export const ManyPermissions: Story = {
  args: {
    isPermissionsReviewCompleted: false,
    features: [
      'accelerometer',
      'ambient-light-sensor',
      'autoplay',
      'battery',
      'camera',
      'clipboard-read',
      'clipboard-write',
      'display-capture',
      'fullscreen',
      'geolocation',
      'gyroscope',
      'microphone',
      'payment',
      'usb',
    ] as AllowedFeatures[],
  },
}

export const Disclaimer: Story = {
  args: {
    isConsentAccepted: false,
  },
}

export const UnknownApp: Story = {
  args: {
    isSafeAppInDefaultList: false,
    isFirstTimeAccessingApp: true,
  },
}

export const AllSteps: Story = {
  args: {
    isConsentAccepted: false,
    isPermissionsReviewCompleted: false,
    isSafeAppInDefaultList: false,
    isFirstTimeAccessingApp: true,
  },
}
