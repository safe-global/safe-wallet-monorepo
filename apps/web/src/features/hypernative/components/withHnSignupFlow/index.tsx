import { useState } from 'react'
import type { ComponentType } from 'react'
import { HnSignupFlow } from '../HnSignupFlow'

export interface WithHnSignupFlowProps {
  onHnSignupClick: () => void
}

/**
 * Higher-order component that wraps a component with HnSignupFlow functionality.
 * Provides the wrapped component with an `onHnSignupClick` callback that opens the signup flow.
 */
export function withHnSignupFlow<P extends object>(WrappedComponent: ComponentType<P & WithHnSignupFlowProps>) {
  return function WithHnSignupFlowComponent(props: P) {
    const [isSignupFlowOpen, setIsSignupFlowOpen] = useState(false)

    const handleCtaClick = () => {
      setIsSignupFlowOpen(true)
    }

    const handleCloseSignupFlow = () => {
      setIsSignupFlowOpen(false)
    }

    return (
      <>
        <WrappedComponent {...props} onHnSignupClick={handleCtaClick} />
        <HnSignupFlow open={isSignupFlowOpen} onClose={handleCloseSignupFlow} />
      </>
    )
  }
}
