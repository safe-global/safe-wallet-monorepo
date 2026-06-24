import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { H6, Text, View } from 'tamagui'
import { DdRum, ErrorSource } from 'expo-datadog'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import Logger from '@/src/utils/logger'

interface Props {
  children: ReactNode
  /** Optional dismiss action (e.g. router.back) — shown alongside Retry on routes that can be left. */
  onDismiss?: () => void
}

interface State {
  hasError: boolean
}

/**
 * Visible error boundary for a whole screen/route. Catches render errors, reports them to Datadog
 * RUM (and the console), and offers a retry instead of unmounting the tree to a blank screen.
 * Use around critical routes; for non-critical inline UI use SilentErrorBoundary.
 */
export class ScreenErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // A caught error never reaches the global ErrorUtils handler, so report it to RUM explicitly,
    // otherwise this crash class would become invisible in Datadog.
    DdRum.addError(error.message, ErrorSource.SOURCE, error.stack ?? '', {
      componentStack: info.componentStack,
      source: 'ScreenErrorBoundary',
    })
    Logger.error('ScreenErrorBoundary caught a render error', error)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          flex={1}
          alignItems="center"
          justifyContent="center"
          gap="$4"
          padding="$4"
          backgroundColor="$background"
          testID="screen-error"
        >
          <SafeFontIcon name="info" size={48} color="$colorSecondary" />
          <H6 fontWeight={600} textAlign="center">
            Something went wrong
          </H6>
          <Text textAlign="center" color="$colorSecondary" width="80%">
            We couldn’t display this screen. Please try again.
          </Text>
          <View flexDirection="row" gap="$3">
            <SafeButton secondary textColor="$colorPrimary" onPress={this.handleRetry} testID="screen-error-retry">
              <SafeFontIcon size={16} name="update" color="$colorPrimary" />
              Retry
            </SafeButton>
            {this.props.onDismiss && (
              <SafeButton text textColor="$colorPrimary" onPress={this.props.onDismiss} testID="screen-error-dismiss">
                Go back
              </SafeButton>
            )}
          </View>
        </View>
      )
    }
    return this.props.children
  }
}
