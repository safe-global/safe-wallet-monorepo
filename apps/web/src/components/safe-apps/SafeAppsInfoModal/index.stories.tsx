import type { Meta, StoryObj } from '@storybook/react'
import SafeAppsInfoModal from './index'
import { FEATURES } from '../types'
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

export const ManyPermissions: Story = {
  args: {
    isPermissionsReviewCompleted: false,
    features: FEATURES.slice(0, 14) as AllowedFeatures[],
  },
}

// The ceiling: every feature a manifest can request.
export const AllPermissions: Story = {
  args: {
    isPermissionsReviewCompleted: false,
    features: FEATURES as AllowedFeatures[],
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
