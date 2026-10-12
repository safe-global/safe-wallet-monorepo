import type { ComponentType, ReactNode } from 'react'
import { createRemoteComponent } from '@remote-dom/react'
import { UiButtonElement } from '../elements'

type RemoteButtonProps = {
  children?: ReactNode
  className?: string
  variant?: string
  size?: string
  disabled?: boolean
  onClick?: () => void
}

// Attributes and the click event are mapped at runtime; the generated props type does not list them.
const RemoteButton = createRemoteComponent('ui-button', UiButtonElement, {
  eventProps: { onClick: { event: 'click' } },
}) as unknown as ComponentType<RemoteButtonProps>

// Stands in for @safe-global/views/components/ui/button inside the worker; the host draws the real Button.
// Click handlers get no event: only plain data may cross to the page.
export const Button = ({ onClick, ...props }: RemoteButtonProps) => (
  <RemoteButton {...props} onClick={onClick ? () => onClick() : undefined} />
)
