import type { Meta, StoryObj } from '@storybook/react'
import { WidgetAction } from './WidgetAction'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { SEVERITY_TO_TITLE } from '@safe-global/utils/features/safe-shield/constants'
import { action } from '@storybook/addon-actions'
import { View } from 'tamagui'

const meta: Meta<typeof WidgetAction> = {
  title: 'SafeShield/Widget/WidgetAction',
  component: WidgetAction,
  decorators: [
    (Story) => (
      <View padding="$1" backgroundColor="$backgroundPaper">
        <Story />
      </View>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof WidgetAction>

export const ChecksPassed: Story = {
  args: {
    status: {
      severity: Severity.OK,
      title: SEVERITY_TO_TITLE[Severity.OK],
    },
    loading: false,
    error: false,
    onPress: action('onPress'),
  },
}

export const IssuesFound: Story = {
  args: {
    status: {
      severity: Severity.CRITICAL,
      title: SEVERITY_TO_TITLE[Severity.CRITICAL],
    },
    loading: false,
    error: false,
    onPress: action('onPress'),
  },
}

export const ReviewDetails: Story = {
  args: {
    status: {
      severity: Severity.INFO,
      title: SEVERITY_TO_TITLE[Severity.INFO],
    },
    loading: false,
    error: false,
    onPress: action('onPress'),
  },
}

export const Warning: Story = {
  args: {
    status: {
      severity: Severity.WARN,
      title: SEVERITY_TO_TITLE[Severity.WARN],
    },
    loading: false,
    error: false,
    onPress: action('onPress'),
  },
}

export const Loading: Story = {
  args: {
    status: null,
    loading: true,
    error: false,
    onPress: action('onPress'),
  },
}

export const Error: Story = {
  args: {
    status: null,
    loading: false,
    error: true,
    onPress: action('onPress'),
  },
}
