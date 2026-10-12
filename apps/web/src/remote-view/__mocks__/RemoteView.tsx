import { createElement } from 'react'
import { REMOTE_VIEWS } from '../frame/views'

// jsdom cannot run the sandboxed iframe, so unit tests render the view directly.
export const RemoteView = ({ name, props }: { name: string; props: Record<string, unknown> }) =>
  createElement(REMOTE_VIEWS[name], props as never)
