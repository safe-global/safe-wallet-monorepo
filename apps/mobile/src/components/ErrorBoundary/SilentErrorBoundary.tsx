import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

/**
 * Renders null when a child throws during render.
 * Use around non-critical UI (badges, icons) that should
 * never crash a parent screen.
 */
export class SilentErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Silently swallow – wrapped UI is non-critical
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}
